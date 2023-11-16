"""This module deals (de)serializing program instructions."""
from typing import Any, Dict, Protocol, Tuple, TypeVar, cast

from anchorpy_core.idl import Idl
from borsh_construct import CStruct
from construct import Adapter, Bytes, Construct, Container, Sequence, Switch
from pyheck import snake

from anchorpy.coder.common import _sighash
from anchorpy.coder.idl import _field_layout
from anchorpy.idl import TypeDefs
from anchorpy.program.common import NamedInstruction


class _Sighash(Adapter):
    """Sighash as a Construct Adapter."""

    def __init__(self) -> None:
        """Initialize."""
        super().__init__(Bytes(8))  # type: ignore

    def _encode(self, obj: str, context, path) -> bytes:
        return _sighash(obj)

    def _decode(self, obj: bytes, context, path):
        raise ValueError("Sighash cannot be reversed")


class InstructionCoder(Adapter):
    """Encodes and decodes program instructions."""

    def __init__(self, idl: Idl) -> None:
        """Init.

        Args:
            idl: The parsed IDL object.
        """
        self.ix_layout = _parse_ix_layout(idl)
        sighasher = _Sighash()
        sighash_layouts: Dict[bytes, Construct] = {}
        sighashes: Dict[str, bytes] = {}
        sighash_to_name: Dict[bytes, str] = {}
        for ix in idl.instructions:
            ix_name = snake(ix.name)
            sh = sighasher.build(ix_name)
            sighashes[ix_name] = sh
            sighash_layouts[sh] = self.ix_layout[ix_name]
            sighash_to_name[sh] = ix_name
        self.sighash_layouts = sighash_layouts
        self.sighashes = sighashes
        self.sighash_to_name = sighash_to_name
        subcon = Sequence(
            "sighash" / Bytes(8),
            Switch(lambda this: this.sighash, sighash_layouts),
        )
        super().__init__(subcon)  # type: ignore

    def encode(self, ix_name: str, ix: Dict[str, Any]) -> bytes:
        """Encode a program instruction.

        Args:
            ix_name: The name of the instruction
            ix: The data to encode.

        Returns:
            The encoded instruction.
        """
        return self.build(NamedInstruction(name=ix_name, data=ix))

    def _decode(self, obj: Tuple[bytes, Any], context, path) -> NamedInstruction:
        return NamedInstruction(data=obj[1], name=self.sighash_to_name[obj[0]])

    def _encode(
        self, obj: NamedInstruction, context: Container, path
    ) -> Tuple[bytes, Any]:
        return (self.sighashes[obj.name], obj.data)


_SA = TypeVar("_SA", bound="_SupportsAdd")


class _SupportsAdd(Protocol):
    """Any type T where +(:T, :T) -> T."""

    def __add__(self: _SA, other: _SA) -> _SA:
        ...


def _parse_ix_layout(idl: Idl) -> Dict[str, Construct]:
    ix_layout: Dict[str, Construct] = {}
    for ix in idl.instructions:
        typedefs = cast(_SupportsAdd, idl.accounts) + cast(_SupportsAdd, idl.types)
        field_layouts = [
            _field_layout(arg, cast(TypeDefs, typedefs)) for arg in ix.args
        ]
        ix_name = snake(ix.name)
        ix_layout[ix_name] = ix_name / CStruct(*field_layouts)
    return ix_layout
