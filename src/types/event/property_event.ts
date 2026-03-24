export interface PropertyEventMetadata {
    hdtId: string
    modelId: string
    propertyName: string
    propertyId: string
}

type PropertyValue =
  | { type: "empty-value"; value: null }
  | { type: "string-value"; value: string }
  | { type: "int-value"; value: number }
  | { type: "float-value"; value: number }
  | { type: "boolean-value"; value: boolean }
  | { type: "double-value"; value: number }
  | { type: "long-value"; value: number };

export interface PropertyEventDocument {
    metaField: PropertyEventMetadata
    timeField: string
    value: PropertyValue
}

export interface MatchEvent {
    propertyName: string
    value: PropertyValue
    timeField: string
}

export interface HdtPropertyMatches {
    hdtId: string
    matchedProperties: string[]
    matchedEvents: MatchEvent[]
}