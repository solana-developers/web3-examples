from __future__ import annotations
import typing
from solders.pubkey import Pubkey
from solders.instruction import Instruction, AccountMeta
from ..program_id import PROGRAM_ID


class InitializeImmutableOwnerAccounts(typing.TypedDict):
    account: Pubkey


def initialize_immutable_owner(
    accounts: InitializeImmutableOwnerAccounts,
    program_id: Pubkey = PROGRAM_ID,
    remaining_accounts: typing.Optional[typing.List[AccountMeta]] = None,
) -> Instruction:
    keys: list[AccountMeta] = [
        AccountMeta(pubkey=accounts["account"], is_signer=False, is_writable=True)
    ]
    if remaining_accounts is not None:
        keys += remaining_accounts
    identifier = b'\x8d2\x0f,\xc3\xf7"<'
    encoded_args = b""
    data = identifier + encoded_args
    return Instruction(program_id, data, keys)
