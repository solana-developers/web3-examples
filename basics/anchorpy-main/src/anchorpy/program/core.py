"""This module defines the Program class."""
from __future__ import annotations

import zlib
from typing import Any, Optional

from anchorpy_core.idl import Idl
from pyheck import snake
from solders.pubkey import Pubkey

from anchorpy.coder.accounts import ACCOUNT_DISCRIMINATOR_SIZE
from anchorpy.coder.coder import Coder
from anchorpy.error import IdlNotFoundError
from anchorpy.idl import _decode_idl_account, _idl_address
from anchorpy.program.common import AddressType, translate_address
from anchorpy.program.namespace.account import AccountClient, _build_account
from anchorpy.program.namespace.instruction import (
    _InstructionFn,
)
from anchorpy.program.namespace.methods import (
    IdlFuncs,
    MethodsBuilder,
    _build_methods_item,
)
from anchorpy.program.namespace.rpc import (
    _build_rpc_item,
    _RpcFn,
)
from anchorpy.program.namespace.simulate import (
    _build_simulate_item,
    _SimulateFn,
)
from anchorpy.program.namespace.transaction import (
    _build_transaction_fn,
    _TransactionFn,
)
from anchorpy.program.namespace.types import _build_types
from anchorpy.provider import Provider


def _parse_idl_errors(idl: Idl) -> dict[int, str]:
    """Turn IDL errors into something readable.

    Uses message if available, otherwise name.

    Args:
        idl: Parsed `Idl` instance.

    """
    errors = {}
    idl_errors = idl.errors
    if idl_errors is not None:
        for e in idl_errors:
            msg = e.msg if e.msg else e.name
            errors[e.code] = msg
    return errors


def _build_namespace(
    idl: Idl,
    coder: Coder,
    program_id: Pubkey,
    provider: Provider,
) -> tuple[
    dict[str, _RpcFn],
    dict[str, _InstructionFn],
    dict[str, _TransactionFn],
    dict[str, AccountClient],
    dict[str, _SimulateFn],
    dict[str, Any],
    dict[str, MethodsBuilder],
]:
    """Generate all namespaces for a given program.

    Args:
        idl: The parsed IDL object.
        coder: The program's Coder object .
        program_id: The Program ID.
        provider: The program's provider.

    Returns:
        The program namespaces.
    """
    idl_errors = _parse_idl_errors(idl)

    rpc = {}
    instruction = {}
    transaction = {}
    simulate = {}
    methods = {}

    for idl_ix in idl.instructions:

        ix_item = _InstructionFn(idl_ix, coder.instruction.build, program_id)
        tx_item = _build_transaction_fn(idl_ix, ix_item)
        rpc_item = _build_rpc_item(idl_ix, tx_item, idl_errors, provider, program_id)
        simulate_item = _build_simulate_item(
            idl_ix,
            tx_item,
            idl_errors,
            provider,
            coder,
            program_id,
            idl,
        )
        idl_funcs = IdlFuncs(
            ix_fn=ix_item, tx_fn=tx_item, rpc_fn=rpc_item, simulate_fn=simulate_item
        )
        methods_item = _build_methods_item(idl_funcs)

        name = snake(idl_ix.name)
        instruction[name] = ix_item
        transaction[name] = tx_item
        rpc[name] = rpc_item
        simulate[name] = simulate_item
        methods[name] = methods_item

    account = _build_account(idl, coder, program_id, provider) if idl.accounts else {}
    types = _build_types(idl)
    return rpc, instruction, transaction, account, simulate, types, methods


def _pako_inflate(data):
    # https://stackoverflow.com/questions/46351275/using-pako-deflate-with-python
    decompress = zlib.decompressobj(15)
    decompressed_data = decompress.decompress(data)
    decompressed_data += decompress.flush()
    return decompressed_data


class Program(object):
    """Program provides the IDL deserialized client representation of an Anchor program.

    This API is the one stop shop for all things related to communicating with
    on-chain programs. Among other things, one can send transactions, fetch
    deserialized accounts, decode instruction data, subscribe to account
    changes, and listen to events.

    In addition to field accessors and methods, the object provides a set of
    dynamically generated properties, also known as namespaces, that
    map one-to-one to program methods and accounts.

    """

    def __init__(
        self, idl: Idl, program_id: Pubkey, provider: Optional[Provider] = None
    ):
        """Initialize the Program object.

        Args:
            idl: The parsed IDL object.
            program_id: The program ID.
            provider: The Provider object for the Program. Defaults to Provider.local().
        """
        self.idl = idl
        self.program_id = program_id
        self.provider = provider if provider is not None else Provider.local()
        self.coder = Coder(idl)

        (
            rpc,
            instruction,
            transaction,
            account,
            simulate,
            types,
            methods,
        ) = _build_namespace(
            idl,
            self.coder,
            program_id,
            self.provider,
        )

        self.rpc = rpc
        self.instruction = instruction
        self.transaction = transaction
        self.account = account
        self.simulate = simulate
        self.type = types
        self.methods = methods

    async def __aenter__(self) -> Program:
        """Use as a context manager."""
        await self.provider.__aenter__()
        return self

    async def __aexit__(self, _exc_type, _exc, _tb):
        """Exit the context manager."""
        await self.close()

    async def close(self) -> None:
        """Use this when you are done with the client."""
        await self.provider.close()

    @staticmethod
    async def fetch_raw_idl(
        address: AddressType,
        provider: Provider,
    ) -> str:
        """Fetch an idl from the blockchain as a raw JSON dictionary.

        Args:
            address: The program ID.
            provider: The network and wallet context.

        Raises:
            IdlNotFoundError: If the requested IDL account does not exist.

        Returns:
            str: The raw IDL.
        """
        program_id = translate_address(address)
        actual_provider = provider if provider is not None else Provider.local()
        idl_addr = _idl_address(program_id)
        account_info = await actual_provider.connection.get_account_info(idl_addr)
        account_info_val = account_info.value
        if account_info_val is None:
            raise IdlNotFoundError(f"IDL not found for program: {address}")
        idl_account = _decode_idl_account(
            account_info_val.data[ACCOUNT_DISCRIMINATOR_SIZE:]
        )
        return _pako_inflate(bytes(idl_account["data"])).decode()

    @classmethod
    async def fetch_idl(
        cls,
        address: AddressType,
        provider: Provider,
    ) -> Idl:
        """Fetch and parse an idl from the blockchain.

        Args:
            address: The program ID.
            provider: The network and wallet context.

        Returns:
            Idl: The fetched IDL.
        """
        raw = await cls.fetch_raw_idl(address, provider)
        return Idl.from_json(raw)

    @classmethod
    async def at(
        cls,
        address: AddressType,
        provider: Optional[Provider] = None,
    ) -> Program:
        """Generate a Program client by fetching the IDL from the network.

        In order to use this method, an IDL must have been previously initialized
        via the anchor CLI's `anchor idl init` command.

        Args:
            address: The program ID.
            provider: The network and wallet context.

        Returns:
            The Program instantiated using the fetched IDL.
        """
        provider_to_use = Provider.local() if provider is None else provider
        program_id = translate_address(address)
        idl = await cls.fetch_idl(program_id, provider_to_use)
        return cls(idl, program_id, provider)
