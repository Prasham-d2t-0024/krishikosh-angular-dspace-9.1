import { Injectable } from '@angular/core';
import { Faqs } from '../shared/faqs.model';
import { CreateData } from './base/create-data';
import { RequestService } from './request.service';
import { RemoteDataBuildService } from '../cache/builders/remote-data-build.service';
import { HALEndpointService } from '../shared/hal-endpoint.service';
import { Observable, filter, find, map, take } from 'rxjs';
import { hasValue, isNotEmpty, isNotEmptyOperator } from 'src/app/shared/empty.util';
import { RemoteData } from './remote-data';
import { HttpOptions } from '../dspace-rest/dspace-rest.service';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { DeleteRequest, GetRequest, PostRequest, PutRequest } from './request.models';
import { getFirstCompletedRemoteData } from '../shared/operators';
import { FindListOptions } from './find-list-options.model';
import { PaginatedList } from './paginated-list.model';
import { FollowLinkConfig } from 'src/app/shared/utils/follow-link-config.model';
import { SearchData, SearchDataImpl } from './base/search-data';
import { ObjectCacheService } from '../cache/object-cache.service';
import { IdentifiableDataService } from './base/identifiable-data.service';

@Injectable({
  providedIn: 'root'
})
export class FaqDataService extends IdentifiableDataService<Faqs> implements SearchData<Faqs> {
  protected linkPath = 'faqs';
  private searchData: SearchDataImpl<Faqs>;
  protected path1 = 'faqs';
  constructor(protected requestService: RequestService,
    protected rdbService: RemoteDataBuildService,
    protected halService: HALEndpointService,
    private httpClient: HttpClient,
    protected objectCache: ObjectCacheService
  ) {
    super('faqs', requestService, rdbService, objectCache, halService);
    this.searchData = new SearchDataImpl(this.path1, requestService, rdbService, objectCache, halService, this.responseMsToLive);
  }

  /**
 * Retrieves the Registration endpoint
 */
  getRegistrationEndpoint(): Observable<string> {
    return this.halService.getEndpoint(this.linkPath);
  }

  /**
  * Register a new email address
  * @param data
  * @param captchaToken the value of x-recaptcha-token header
  */
  submitAnswer(data: any, captchaToken: string = null, type?: string): Observable<RemoteData<Faqs>> {
    const registration = {
      question: data.question,
      answers: data.answers,
      status: data.status
    };

    const requestId = this.requestService.generateRequestId();

    const href$ = this.getRegistrationEndpoint();

    const options: HttpOptions = Object.create({});
    let headers = new HttpHeaders();
    if (captchaToken) {
      headers = headers.append('x-recaptcha-token', captchaToken);
    }
    options.headers = headers;

    if (hasValue(type)) {
      options.params = type ?
        new HttpParams({ fromString: 'accountRequestType=' + type }) : new HttpParams();
    }

    href$.pipe(
      find((href: string) => hasValue(href)),
      map((href: string) => {
        const request = new PostRequest(requestId, href, registration, options);
        this.requestService.send(request);
      })
    ).subscribe();

    return this.rdbService.buildFromRequestUUID<Faqs>(requestId).pipe(
      getFirstCompletedRemoteData()
    );
  }

  updateAnswer(data: any, id: string, captchaToken: string = null, type?: string): Observable<RemoteData<Faqs>> {
    let registration = {
      question: data.question,
      answers: data.answers,
      status: data.status
    };
    const requestId = this.requestService.generateRequestId();

    const href$ = this.getRegistrationEndpoint();

    const options: HttpOptions = Object.create({});
    let headers = new HttpHeaders();
    if (captchaToken) {
      headers = headers.append('x-recaptcha-token', captchaToken);
    }
    options.headers = headers;

    if (hasValue(type)) {
      options.params = type ?
        new HttpParams({ fromString: 'accountRequestType=' + type }) : new HttpParams();
    }

    href$.pipe(
      find((href: string) => hasValue(href)),
      map((href: string) => {
        const request = new PutRequest(requestId, href + '/' + id, registration, options);
        this.requestService.send(request);
      })
    ).subscribe();

    return this.rdbService.buildFromRequestUUID<Faqs>(requestId).pipe(
      getFirstCompletedRemoteData()
    );
  }
  updateAnswerIndex(data: any, id: string, captchaToken: string = null, type?: string): Observable<RemoteData<Faqs>> {
    let registration = {
      question: data.question,
      answers: data.answers,
      status: data.status,
      index: data.index
    };
    const requestId = this.requestService.generateRequestId();

    const href$ = this.getRegistrationEndpoint();

    const options: HttpOptions = Object.create({});
    let headers = new HttpHeaders();
    if (captchaToken) {
      headers = headers.append('x-recaptcha-token', captchaToken);
    }
    options.headers = headers;

    if (hasValue(type)) {
      options.params = type ?
        new HttpParams({ fromString: 'accountRequestType=' + type }) : new HttpParams();
    }

    href$.pipe(
      find((href: string) => hasValue(href)),
      map((href: string) => {
        const request = new PutRequest(requestId, href + '/' + id, registration, options);
        this.requestService.send(request);
      })
    ).subscribe();

    return this.rdbService.buildFromRequestUUID<Faqs>(requestId).pipe(
      getFirstCompletedRemoteData()
    );
  }

  public getFAQs(): Observable<RemoteData<Faqs>> {
    let url: string;
    const href$ = this.getRelationshipEndpoint1("faqs").pipe(
      find((href: string) => hasValue(href)),
    );
    href$.subscribe((data) => {
      url = data + "/search/getByStatus?status=faq";
    });
    return this.getData(url);
  }

  searchBy(searchMethod: string, options?: FindListOptions, useCachedVersionIfAvailable?: boolean, reRequestOnStale?: boolean, ...linksToFollow: FollowLinkConfig<Faqs>[]): Observable<RemoteData<PaginatedList<Faqs>>> {
    return this.searchData.searchBy(searchMethod, options, false, false, ...linksToFollow);
  }

  deleteFAQs(uuid: string,captchaToken :string =null) : any {
    const requestId = this.requestService.generateRequestId();
    const href$ = this.getRegistrationEndpoint();
    const options: HttpOptions = Object.create({});
    let headers = new HttpHeaders();
    if (captchaToken) {
      headers = headers.append('x-recaptcha-token', captchaToken);
    }
    options.headers = headers;
  
    href$.pipe(
      find((href: string) => hasValue(href)),
      map((href: string) => {
        const request = new DeleteRequest(requestId, href + '/' + uuid);
        this.requestService.send(request);
      })
    ).subscribe();
  
    return this.rdbService.buildFromRequestUUID<Faqs>(requestId).pipe(
      getFirstCompletedRemoteData()
    );
  }

  public getAskUs(): Observable<RemoteData<Faqs>> {
    let url: string;
    const href$ = this.getRelationshipEndpoint1("faqs").pipe(
      find((href: string) => hasValue(href)),
    );
    href$.subscribe((data) => {
      url = data + "/search/getByStatus?status=ask us";
    });
    return this.getData(url);
  }

  getRelationshipEndpoint1(url: string) {
    return this.halService.getEndpoint(url).pipe(
      filter((href: string) => isNotEmpty(href)),
      map((href: string) => `${href}`));
  }

  private getData(url: string): Observable<RemoteData<Faqs>> {
    return this.httpClient.get<RemoteData<Faqs>>(url)
  }
}

