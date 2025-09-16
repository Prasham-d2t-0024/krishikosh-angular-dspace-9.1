import { autoserialize, deserialize, deserializeAs, inheritSerialization } from 'cerialize';
import { typedObject } from '../cache/builders/build-decorators';
import { IDToUUIDSerializer } from '../cache/id-to-uuid-serializer';
import { excludeFromEquals } from '../utilities/equals.decorators';
import { BitstreamFormatSupportLevel } from './bitstream-format-support-level';
import { BOOKMARK } from './bookmark.resource-type';
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
export class Bookmark extends DSpaceObject {
    static type = BOOKMARK;
   
    @autoserialize
    status: string;

    /**
     * String representing the MIME type of this Bitstream Format
     */
    @autoserialize
    submitterRest: EPerson;

    

    /**
     * True if the Bitstream Format is used to store system information, rather than the content of items in the system
     */
    @autoserialize
    itemRest: Item;



    /**
     * The {@link HALLink}s for this BitstreamFormat
     */
    @deserialize
    _links: {
        self: HALLink;
    };
}
