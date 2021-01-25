import {
  SanityAssetDocument as SanityAssetDocumentType,
  SanityDocument as SanityDocumentType
} from '@sanity/client';

export type Maybe<T> = T | null | undefined | void;

export type SanityAssetDocument = SanityAssetDocumentType;

export interface SanityObject {
  // _type: string;
  [key: string]: SanityFieldValue;
}

export type SanityFieldValue =
  | SanityFieldValue[]
  | SanityReference
  | SanityObject
  | SanityAssetObject
  | boolean
  | string
  | number
  | void;

export type SanityDocument = Pick<SanityDocumentType, '_id' | '_type'> & {
  [key: string]: SanityFieldValue;
};

export interface MigratedDocument<
  DocType extends SanityDocument = SanityDocument
> {
  source: DocType;
  destination: DocType;
}

export interface UnMigratedDocument<
  DocType extends SanityDocument = SanityDocument
> {
  source: DocType;
  destination?: DocType;
}

export type MigratedAsset = MigratedDocument<SanityAssetDocument>;
export type UnMigratedAsset = UnMigratedDocument<SanityAssetDocument>;

export interface SanityReference extends SanityObject {
  _type: 'reference';
  _ref: string;
}

export interface SanityAssetObject extends SanityObject {
  _type: 'image' | 'file';
  asset: SanityReference;
}
