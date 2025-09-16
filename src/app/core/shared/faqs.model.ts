import { typedObject } from '../cache/builders/build-decorators';
import { ResourceType } from './resource-type';
import { REGISTRATION } from './registration.resource-type';
import { UnCacheableObject } from './uncacheable-object.model';
import { FAQS } from './faqs.resource-type';
import { autoserialize, deserialize, inheritSerialization } from 'cerialize';
import { HALLink } from './hal-link.model';
import { DSpaceObject } from './dspace-object.model';

@typedObject
@inheritSerialization(DSpaceObject)
export class Faqs extends DSpaceObject {
  static type = FAQS;

  @autoserialize
  faqs:any;
  @autoserialize
  question:string;
  @autoserialize
  answers:string;
  @autoserialize
  index:number;

  /**
   * The {@link HALLink}s for this WorkFlowProcess
   */
  @deserialize
  _links: {
    self: HALLink;
  };
}
