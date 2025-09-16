import { autoserialize, deserialize, inheritSerialization, deserializeAs } from 'cerialize';
import { Observable } from 'rxjs';
import { link, typedObject } from '../cache/builders/build-decorators';

import { DMSEVENT } from './dmsevent.resource-type';
import { DSpaceObject } from './dspace-object.model';
import { HALLink } from './hal-link.model';
import { HALResource } from './hal-resource.model';
import { Item } from './item.model';
import { EPerson } from '../eperson/models/eperson.model';



@typedObject
@inheritSerialization(DSpaceObject)
export class DmsEvent extends DSpaceObject implements HALResource {
    static type = DMSEVENT;

    /**
     * The size of this bitstream in bytes
     */
    @autoserialize
    description: string;
    @autoserialize
    item: any; 
    @autoserialize
    ePersonRest: any;
    
    @autoserialize
    action: number;
    @autoserialize
    documenttypenameRest: any;
    @autoserialize
    dspaceObject: any;
    @autoserialize
    title: any;
    /**
     * The name of the Bundle this Bitstream is part of
     */
    @deserializeAs(Date)
    actionDate: Date;

    /**
     * The {@link HALLink}s for this Bitstream
     */
    @deserialize
    _links: {
        self: HALLink;
        bundle: HALLink;
        format: HALLink;
        content: HALLink;
        thumbnail: HALLink;
    };

    get name(): string {
        return this.description;
    }

}
