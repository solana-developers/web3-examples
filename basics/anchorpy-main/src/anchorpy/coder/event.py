"""This module deals with (de)serializing Anchor events."""
from hashlib import sha256
from typing import Any, Dict, Optional, Tuple

from anchorpy_core.idl import (
    Idl,
    IdlEvent,
    IdlField,
    IdlTypeDefinition,
    IdlTypeDefinitionTyStruct,
)
from construct import Adapter, Bytes, Construct, Sequence, Switch
from pyheck import snake

from anchorpy.coder.idl import _typedef_layout
from anchorpy.program.common import Event


def _event_discriminator(name: str) -> bytes:
    """Get 8-byte discriminator from event name.

    Args:
        name: The event name.

    Returns:
        Discriminator
    """
    return sha256(f"event:{name}".encode()).digest()[:8]


def _event_layout(event: IdlEvent, idl: Idl) -> Construct:
    event_type_def = IdlTypeDefinition(
        name=event.name,
        docs=None,
        ty=IdlTypeDefinitionTyStruct(
            fields=[
                IdlField(name=snake(f.name), docs=None, ty=f.ty) for f in event.fields
            ],
        ),
    )
    return _typedef_layout(event_type_def, idl.types, event.name)


class EventCoder(Adapter):
    """Encodes and decodes Anchor events."""

    def __init__(self, idl: Idl):
        """Initialize the EventCoder.

        Args:
            idl: The parsed Idl object.
        """
        self.idl = idl
        idl_events = idl.events
        layouts: Dict[str, Construct]
        if idl_events:
            layouts = {event.name: _event_layout(event, idl) for event in idl_events}
        else:
            layouts = {}
        self.layouts = layouts
        self.discriminators: Dict[bytes, str] = (
            {}
            if idl_events is None
            else {_event_discriminator(event.name): event.name for event in idl_events}
        )
        self.discriminator_to_layout = {
            disc: self.layouts[event_name]
            for disc, event_name in self.discriminators.items()
        }
        subcon = Sequence(
            "discriminator" / Bytes(8),  # not base64-encoded here
            Switch(lambda this: this.discriminator, self.discriminator_to_layout),
        )
        super().__init__(subcon)  # type: ignore

    def _decode(self, obj: Tuple[bytes, Any], context, path) -> Optional[Event]:
        disc = obj[0]
        try:
            event_name = self.discriminators[disc]
        except KeyError:
            return None
        return Event(data=obj[1], name=event_name)
