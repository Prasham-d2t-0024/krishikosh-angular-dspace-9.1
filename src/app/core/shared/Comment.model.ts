import { autoserialize, deserialize, deserializeAs, inheritSerialization } from 'cerialize';
import { typedObject } from '../cache/builders/build-decorators';
import { IDToUUIDSerializer } from '../cache/id-to-uuid-serializer';
import { excludeFromEquals } from '../utilities/equals.decorators';
import { BitstreamFormatSupportLevel } from './bitstream-format-support-level';
import { COMMENT } from './Comment.resource-type';
import { HALLink } from './hal-link.model';
import { ResourceType } from './resource-type';
import { CacheableObject } from '../cache/cacheable-object.model';
import { DSpaceObject } from './dspace-object.model';
import { EPerson } from '../eperson/models/eperson.model';
import { Item } from './item.model';
import { ChildHALResource } from './child-hal-resource.model';
/**
 * Model class for a Bitstream Format
 */
@typedObject
@inheritSerialization(DSpaceObject)
export class Comment extends DSpaceObject  {
    static type = COMMENT;
    @autoserialize
    actiondate: Date;
    
    /**
     * Short description of this Bitstream Format
     */
   

    /**
     * Description of this Bitstream Format
     */
    @autoserialize
    comment: string;
    @autoserialize
    raitingmap: any;
    /**
     * String representing the MIME type of this Bitstream Format
     */
    @autoserialize
    submitterRest: EPerson;

    /**
     * The level of support the system offers for this Bitstream Format
     */
    @autoserialize
    supportLevel: BitstreamFormatSupportLevel;

    /**
     * True if the Bitstream Format is used to store system information, rather than the content of items in the system
     */
    @autoserialize
    itemRest: Item;

    /**
     * String representing this Bitstream Format's file extension
     */
    @autoserialize
    ratingcount: number;

    /**
     * Universally unique identifier for this Bitstream Format
     * This UUID is generated client-side and isn't used by the backend.
     * It is based on the ID, so it will be the same for each refresh.
     */
    @autoserialize
    status: number;

    /**
     * Identifier for this Bitstream Format
     * Note that this ID is unique for bitstream formats,
     * but might not be unique across different object types
     */
    @autoserialize
    commenttype: number;

    /**
     * The {@link HALLink}s for this BitstreamFormat
     */
    @deserialize
    _links: {
        self: HALLink;
    };
}
