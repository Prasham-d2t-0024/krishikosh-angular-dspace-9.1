import { autoserialize, deserialize, deserializeAs,inheritSerialization } from 'cerialize';
import { typedObject } from '../../cache/builders/build-decorators';
import { DSpaceObject } from '../dspace-object.model';
import { CHART_FORMAT } from './chart.resource-type';
import { HALLink } from '../hal-link.model';
import { Item } from '../item.model';
import { GenericConstructor } from '../generic-constructor';
import { ListableObject } from 'src/app/shared/object-collection/shared/listable-object.model';
import { isEmpty } from 'src/app/shared/empty.util';
import { HandleObject } from '../handle-object.model';
import { PAGE_FORMAT } from './pagedetail.resource-type';


/**
 * Model class for a WORKFLOWPROCESSE Format
 */
@typedObject
@inheritSerialization(DSpaceObject)
export class PageDetail extends DSpaceObject implements HandleObject{
  static type = PAGE_FORMAT;

  @autoserialize
  id: string;
  @autoserialize
  uuid: string;
  @autoserialize
  index: number;
  @autoserialize
  handle :any;
  @autoserialize
  metadata: any;
  @autoserialize
  owner: any;  
  @autoserialize
  workflowprocesse:any;
  @autoserialize
  workflowprocesseperson:any;
  @autoserialize
  workFlowProcessOutwardDetailsRest:any;
  @autoserialize
  workflowProcessNoteRest:any;
  @autoserialize
  workFlowProcessDraftDetailsRest:any;
  @autoserialize
  itemRest:Item;
  @autoserialize
  priorityRest:any;
  @autoserialize
  dispatchModeRest:any;
  @autoserialize
  eligibleForFilingRest:any;
  @autoserialize
  workFlowProcessInwardDetailsRest:any;
  @autoserialize
  sender:any;
  @autoserialize
  workflowType:any;
  @autoserialize
  workflowProcessSenderDiaryRest:any;
  @autoserialize
  Subject:any;
  @autoserialize
  workflowStatus:any;
  @autoserialize
  mode:any;
  @autoserialize
  ismode:any;
  @autoserialize
  dateRecived:string;
  @autoserialize
  ePersonRest:any;
  @autoserialize
  currentrecipient:string;
  @autoserialize
  dueDate:string;
  @autoserialize
  isread:boolean;
  @autoserialize
  remark:string;
  @autoserialize
  value:string;
  
  
  getRenderTypes(): (string | GenericConstructor<ListableObject>)[] {
    const entityType = this.firstMetadataValue('dspace.entity.type');
    if (isEmpty(entityType)) {
      return super.getRenderTypes();
    }
    return [entityType, ...super.getRenderTypes()];
  }

 
  /**
   * The {@link HALLink}s for this WorkFlowProcess
   */
  @deserialize
  _links: {
    self: HALLink;
  };
}
