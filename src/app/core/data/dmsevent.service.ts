import { DmsEvent } from './../shared/dmsevent.model';
import { getFirstSucceededRemoteData, getRemoteDataPayload } from './../shared/operators';

import { Injectable } from '@angular/core';

import { createSelector } from '@ngrx/store';
import { RequestService } from './request.service';
import { RemoteDataBuildService } from '../cache/builders/remote-data-build.service';
import { Store } from '@ngrx/store';
import { ObjectCacheService } from '../cache/object-cache.service';
import { HALEndpointService } from '../shared/hal-endpoint.service';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { HttpClient } from '@angular/common/http';
import { DSOChangeAnalyzer } from './dso-change-analyzer.service';
import { HttpOptions } from '../dspace-rest/dspace-rest.service';
import { Observable } from 'rxjs';
import { RemoteData } from './remote-data';
import { filter, map, take, find } from 'rxjs/operators';
import {  PatchRequest, PostRequest, PutRequest, DeleteRequest } from './request.models';
import { AppState } from '../../app.reducer';

import { hasValue, isNotEmpty } from 'src/app/shared/empty.util';
import { DMSEVENT } from '../shared/dmsevent.resource-type';
import { NoContent } from '../shared/NoContent.model';
import { URLCombiner } from '../url-combiner/url-combiner';
import { FollowLinkConfig } from 'src/app/shared/utils/follow-link-config.model';
import { PaginatedList } from './paginated-list.model';
import { RequestParam } from '../cache/models/request-param.model';
import { IdentifiableDataService } from './base/identifiable-data.service';
import { dataService } from './base/data-service.decorator';
import { SearchData, SearchDataImpl } from './base/search-data';
import { FindListOptions } from './find-list-options.model';
@Injectable({
    providedIn: 'root'
})
@dataService(DMSEVENT)
export class DmseventSerive extends IdentifiableDataService<DmsEvent> implements SearchData<DmsEvent> { 
    protected linkPath = 'events';
    protected getitemProgressreport = 'getCurrentDateEvent';
    private searchData: SearchData<DmsEvent>;
    constructor(
        protected requestService: RequestService,
        protected rdbService: RemoteDataBuildService,
        protected objectCache: ObjectCacheService,
        protected halService: HALEndpointService,
        protected notificationsService: NotificationsService,
        protected http: HttpClient,
        protected comparator: DSOChangeAnalyzer<DmsEvent>
    ) {
        super("events", requestService, rdbService, objectCache, halService);
        this.searchData = new SearchDataImpl(this.linkPath, requestService, rdbService, objectCache, halService, this.responseMsToLive);
    }

    getEndpoint(): Observable<string> {
        return this.halService.getEndpoint(this.linkPath);
    }
    public searchBy(searchMethod: string, options?: FindListOptions, useCachedVersionIfAvailable?: boolean, reRequestOnStale?: boolean, ...linksToFollow: FollowLinkConfig<DmsEvent>[]): Observable<RemoteData<PaginatedList<DmsEvent>>> {
        return this.searchData.searchBy(searchMethod, options, useCachedVersionIfAvailable, reRequestOnStale, ...linksToFollow);
    }
    public _getprogressReportByDate(actiontype:string,userID:string,fromdate: string, todate: string, options: FindListOptions = {}, useCachedVersionIfAvailable = false, reRequestOnStale = true, ...linksToFollow: FollowLinkConfig<DmsEvent>[]): Observable<RemoteData<PaginatedList<DmsEvent>>> {
        
        if (userID === "") {
            if (actiontype === "") {
                options = Object.assign({}, options, {
                    searchParams: [new RequestParam('stdate', fromdate), new RequestParam('enddate', todate)]
                });  
            } else {
                options = Object.assign({}, options, {
                    searchParams: [new RequestParam('stdate', fromdate), new RequestParam('enddate', todate), new RequestParam('action', actiontype) ]
                }); 
            }
             
        } else {
           
           
            if (actiontype === "") {
                options = Object.assign({}, options, {
                    searchParams: [new RequestParam('stdate', fromdate), new RequestParam('enddate', todate), new RequestParam('userID', userID)]
                });
            } else {
                options = Object.assign({}, options, {
                    searchParams: [new RequestParam('stdate', fromdate), new RequestParam('enddate', todate), , new RequestParam('userID', userID) ,new RequestParam('action', actiontype)]
                });
            }
           
           
            
        }
       
        return this.searchBy(this.getitemProgressreport, options, useCachedVersionIfAvailable, reRequestOnStale, ...linksToFollow).pipe(
            filter((collections: RemoteData<PaginatedList<DmsEvent>>) => !collections.isResponsePending));
    }

}
