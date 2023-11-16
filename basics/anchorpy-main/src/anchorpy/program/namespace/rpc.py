"""This module contains code for generating RPC functions."""
from typing import Any, Awaitable, Dict, Protocol

from anchorpy_core.idl import IdlInstruction
from solana.rpc.commitment import Confirmed
from solana.rpc.core import RPCException
from solders.pubkey import Pubkey
from solders.signature import Signature

from anchorpy.error import ProgramError
from anchorpy.program.context import EMPTY_CONTEXT, Context, _check_args_length
from anchorpy.program.namespace.transaction import _TransactionFn
from anchorpy.provider import Provider


class _RpcFn(Protocol):
    """_RpcFn is a single RPC method generated from an IDL, sending a transaction paid for and signed by the configured provider."""  # noqa: E501

    def __call__(
        self,
        *args: Any,
        ctx: Context = EMPTY_CONTEXT,
    ) -> Awaitable[Signature]:
        """Call the function (this is just a protocol declaration).

        Args:
            *args: The positional arguments for the program. The type and number
                of these arguments depend on the program being used.
            ctx: non-argument parameters to pass to the method.
        """
        ...


def _build_rpc_item(  # ts: RpcFactory
    idl_ix: IdlInstruction,
    tx_fn: _TransactionFn,
    idl_errors: Dict[int, str],
    provider: Provider,
    program_id: Pubkey,
) -> _RpcFn:
    """Build the function that sends transactions for the given method.

    Args:
        idl_ix: The IDL instruction object.
        tx_fn: The function that generates the `Transaction` to send.
        idl_errors: Mapping of error code to error message.
        provider: Anchor Provider instance.
        program_id: The ID of the Anchor program.

    Returns:
        The RPC function.
    """

    async def rpc_fn(*args: Any, ctx: Context = EMPTY_CONTEXT) -> Signature:
        recent_blockhash = (
            await provider.connection.get_latest_blockhash(Confirmed)
        ).value.blockhash
        tx = tx_fn(
            *args, payer=provider.wallet.payer, blockhash=recent_blockhash, ctx=ctx
        )
        _check_args_length(idl_ix, args)
        try:
            return await provider.send(tx, ctx.options)
        except RPCException as e:
            err_info = e.args[0]
            translated_err = ProgramError.parse(err_info, idl_errors, program_id)
            if translated_err is not None:
                raise translated_err from e
            raise

    return rpc_fn
