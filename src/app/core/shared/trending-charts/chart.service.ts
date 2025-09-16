import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { JwtPayload } from 'jwt-decode';
import { catchError, filter, find, map, Observable, of, switchMap } from 'rxjs';
import { hasValue, isNotEmpty } from 'src/app/shared/empty.util';
import { RequestService } from '../../data/request.service';
import { RemoteDataBuildService } from '../../cache/builders/remote-data-build.service';
import { HALEndpointService } from '../hal-endpoint.service';
import { Chart } from './chart.model';
import { RemoteData } from '../../data/remote-data';
import { HttpOptions } from '../../dspace-rest/dspace-rest.service';
import { DeleteRequest, PatchRequest, PostRequest, PutRequest } from '../../data/request.models';
import { getFirstCompletedRemoteData } from '../operators';
import { PageDetail } from './pagedetail.model';


@Injectable({
  providedIn: 'root'
})
export class ChartService {
  protected path1 = 'items';
  protected path2 = 'collections';
  protected path3 = 'communities';
  protected path4 = "workflowitems";
  protected path5 = "vocabularies";
  protected path6 = "workspaceitems";
  protected savePageNameLink = 'pagemasters';
  protected detailPageNameLink = 'pagedetails';
  protected searchByMetadataPath = '/filterbyInwardAndOutWard';
  url: string;
  primaryColor: string | null = null;
  secondaryColor: string | null = null;
  trendingItemsChartTheme: string | null = null;
  trendingSearchesChartTheme: string | null = null;
  trendingTypesChartTheme: string | null = null;
  trendingCommunitiesChartTheme: string | null = null;
  trendingCollectionsChartTheme: string | null = null;
  itemPageAnalyticsChartTheme: string | null = null;
  mapThemeShades: string[];
  constructor(protected requestService: RequestService,
    private httpClient: HttpClient,
    protected rdbService: RemoteDataBuildService,
    protected halService: HALEndpointService,) {
    this.loadThemeConfig();
  }
  getRelationshipEndpoint(url1, i?: string) {
    return this.halService.getEndpoint(url1).pipe(
      filter((href: string) => isNotEmpty(href)),
      map((href: string) => `${href}${i}`));
  }

   getRelationshipEndpoint2(url1, i?: string) {
    return this.halService.getEndpoint(url1).pipe(
      filter((href: string) => isNotEmpty(href)),
      map((href: string) => `${href}`));
  }

  getRelationshipEndpoint3(url: string) {
    return this.halService.getEndpoint(url).pipe(
      filter((href: string) => isNotEmpty(href)),
      map((href: string) => `${href}`));
  }

  public findAllByGeolocation(i: string): Observable<RemoteData<Chart>> {
    const href$ = this.getRelationshipEndpoint(this.path1, i).pipe(
      find((href: string) => hasValue(href)),
    );
    href$.subscribe((data) => {
      this.url = data;
    });
    return this.getData(this.url);
  }

  public findhierachiesBycommunity(i: string) {
    const href$ = this.getRelationshipEndpoint(this.path2, '/' + i).pipe(
      find((href: string) => hasValue(href)),
    );
    href$.subscribe((data) => {
      this.url = data;
    });
    return this.getData(this.url + '/parentCommunity?embed=parentCommunity');
  }

  public findhierachiesByParentcommunity(i: string) {
    const href$ = this.getRelationshipEndpoint(this.path3, '/' + i).pipe(
      find((href: string) => hasValue(href)),
    );
    href$.subscribe((data) => {
      this.url = data;
    });
    return this.getData(this.url + '/parentCommunity');
  }

  public findCollectionName(i: string) {
    const href$ = this.getRelationshipEndpoint(this.path4, '/' + i).pipe(
      find((href: string) => hasValue(href)),
    );
    href$.subscribe((data) => {
      this.url = data;
    });
    return this.getData(this.url + '?embed=item');
  }

  public searchASFAsubject(i: string,pageNo:number) {
    const href$ = this.getRelationshipEndpoint3(this.path5).pipe(
      find((href: string) => hasValue(href)),
    );
    href$.subscribe((data) => {
      this.url = data;
    });
    return this.getData(this.url + '/asfa/entries?filter=' + i + '&exact=false&page='+pageNo+'&size=20'
    );
  }

  addDynamicPage(postData: any, captchaToken: string = null) {
    const requestId = this.requestService.generateRequestId();
    const href$ = this.getRelationshipEndpoint(this.savePageNameLink,'');
    const options: HttpOptions = Object.create({});
    let headers = new HttpHeaders();
    if (captchaToken) {
      headers = headers.append('x-recaptcha-token', captchaToken);
    }
    options.headers = headers;
  
    href$.pipe(
      find((href: string) => hasValue(href)),
      map((href: string) => {
        const request = new PostRequest(requestId, href, JSON.stringify(postData), options);
        this.requestService.send(request);
      })
    ).subscribe();
  
    return this.rdbService.buildFromRequestUUID<Chart>(requestId).pipe(
      getFirstCompletedRemoteData()
    );
  }

  getDynamicPages() {
      const href$ = this.getRelationshipEndpoint3(this.savePageNameLink).pipe(
        find((href: string) => hasValue(href)),
      );
      href$.subscribe((data) => {
        this.url = data;
      });
      return this.getData(`${this.url}/search/getPageMaster`);
  }
  
  getDynamicPagesMenu(): Observable<any> {
    return this.getRelationshipEndpoint3(this.savePageNameLink).pipe(
      find((href: string) => hasValue(href)),
      switchMap((url: string) => {
        this.url = url;
        return this.getData(`${this.url}/search/getPageMaster`);
      }),
      catchError(err => {
        console.error('Error in getDynamicPagesMenu():', err);
        return of([]); // default fallback
      })
    );
  }


  getDynamicPageContent(type: string) {
    const href$ = this.getRelationshipEndpoint3(this.detailPageNameLink).pipe(
      find((href: string) => hasValue(href)),
    );
    href$.subscribe((data) => {
      this.url = data;
    });
    return this.getData(this.url + '/search/findByType?type=' + type);
  }

  getGoegraphicaldrpData(type: string) {
    const href$ = this.getRelationshipEndpoint3(this.path1).pipe(
      find((href: string) => hasValue(href)),
    );
    href$.subscribe((data) => {
      this.url = data;
    });
    return this.getData(this.url + '/getGeonames?searchname=' + type);
  }

  addPageContent(postData: any, captchaToken: string = null) {
    const requestId = this.requestService.generateRequestId();
    const href$ = this.getRelationshipEndpoint3(this.detailPageNameLink);
    const options: HttpOptions = Object.create({});
    let headers = new HttpHeaders();
    if (captchaToken) {
      headers = headers.append('x-recaptcha-token', captchaToken);
    }
    options.headers = headers;
  
    href$.pipe(
      find((href: string) => hasValue(href)),
      map((href: string) => {
        const request = new PostRequest(requestId, href, JSON.stringify(postData), options);
        this.requestService.send(request);
      })
    ).subscribe();
  
    return this.rdbService.buildFromRequestUUID<PageDetail>(requestId).pipe(
      getFirstCompletedRemoteData()
    );
  }

  editPageName(postData: any, id:string,captchaToken: string = null) {
    const requestId = this.requestService.generateRequestId();
    const href$ = this.getRelationshipEndpoint3(this.savePageNameLink);
    const options: HttpOptions = Object.create({});
    let headers = new HttpHeaders();
    if (captchaToken) {
      headers = headers.append('x-recaptcha-token', captchaToken);
    }
    options.headers = headers;
  
    href$.pipe(
      find((href: string) => hasValue(href)),
      map((href: string) => {
        const request = new PutRequest(requestId, href + '/' + id, JSON.stringify(postData), options);
        this.requestService.send(request);
      })
    ).subscribe();
  
    return this.rdbService.buildFromRequestUUID<PageDetail>(requestId).pipe(
      getFirstCompletedRemoteData()
    );
  }

  updatePageContent(postData: any, id: string, captchaToken: string = null) {
    const requestId = this.requestService.generateRequestId();
    const href$ = this.getRelationshipEndpoint3(this.detailPageNameLink);
    const options: HttpOptions = Object.create({});
    let headers = new HttpHeaders();
    if (captchaToken) {
      headers = headers.append('x-recaptcha-token', captchaToken);
    }
    options.headers = headers;
  
    href$.pipe(
      find((href: string) => hasValue(href)),
      map((href: string) => {
        const newUrl = href + '/' + id;
        href = newUrl;
        const request = new PutRequest(requestId, href, JSON.stringify(postData), options);
        this.requestService.send(request);
      })
    ).subscribe();
  
    return this.rdbService.buildFromRequestUUID<PageDetail>(requestId).pipe(
      getFirstCompletedRemoteData()
    );
  }

  removeASFAFromDynamicForm(id: string): Observable<any> {
    const requestBody = [
        {
            "op": "remove",
            "path": "/sections/traditionalpagetwo/dc.subject.asfa"
        }
    ];

    // Observable that constructs the URL
    const href$ = this.getRelationshipEndpoint3(this.path6).pipe(
        find((href: string) => !!href), // Check if the href has a value
        switchMap((data: string) => {
            // Construct the new URL by removing 'workflowprocesses' and appending the download path
            const finalUrl = `${data}/${id}`;

            // Return an HTTP request Observable with the constructed URL and request body
            return this.httpClient.patch(finalUrl, requestBody);
        })
    );

    // Return the combined Observable for subscription in the component
    return href$;
}

deleteDynamicPageContent(id: string,captchaToken:any = null) {
  const requestId = this.requestService.generateRequestId();
  const href$ = this.getRelationshipEndpoint3(this.detailPageNameLink);
  const options: HttpOptions = Object.create({});
  let headers = new HttpHeaders();
  if (captchaToken) {
    headers = headers.append('x-recaptcha-token', captchaToken);
  }
  options.headers = headers;

  href$.pipe(
    find((href: string) => hasValue(href)),
    map((href: string) => {
      const request = new DeleteRequest(requestId, href + '/'+id);
      this.requestService.send(request);
    })
  ).subscribe();

  return this.rdbService.buildFromRequestUUID<Chart>(requestId).pipe(
    getFirstCompletedRemoteData()
  );
}

deleteDynamicPage(id: string,captchaToken:any = null) {
  const requestId = this.requestService.generateRequestId();
  const href$ = this.getRelationshipEndpoint3(this.savePageNameLink);
  const options: HttpOptions = Object.create({});
  let headers = new HttpHeaders();
  if (captchaToken) {
    headers = headers.append('x-recaptcha-token', captchaToken);
  }
  options.headers = headers;

  href$.pipe(
    find((href: string) => hasValue(href)),
    map((href: string) => {
      const request = new DeleteRequest(requestId, href + '/' +id);
      this.requestService.send(request);
    })
  ).subscribe();

  return this.rdbService.buildFromRequestUUID<Chart>(requestId).pipe(
    getFirstCompletedRemoteData()
  );
}

 downloadZIP() {
    return this.getRelationshipEndpoint2(this.path1)
  }

  private getData(url: string): Observable<RemoteData<Chart>> {
    return this.httpClient.get<RemoteData<Chart>>(url)
  }

  loadThemeConfig(): void {
    this.httpClient.get<any>('assets/theme-config.json')
      .toPromise()
      .then(config => {
          this.primaryColor = config.bootstrap_colors.primary;
          this.secondaryColor = config.bootstrap_colors.secondary;
          this.trendingItemsChartTheme = config?.chart_theme?.trending_items;
          this.trendingSearchesChartTheme = config?.chart_theme?.trending_searches;
          this.trendingTypesChartTheme = config?.chart_theme?.trending_types;
          this.trendingCommunitiesChartTheme = config?.chart_theme?.trending_communities;
          this.trendingCollectionsChartTheme = config?.chart_theme?.trending_collections;
          this.itemPageAnalyticsChartTheme = config?.chart_theme?.item_page_analytics;
          this.mapThemeShades = config && config.map_theme && Object.keys(config.map_theme).includes('global_map_theme') ? config.map_theme.global_map_theme : null;          
      });
  }

  generateShades(): string[] {
    let hex = this.primaryColor;
    let steps = 4;
    const { h, s, l } = this.hexToHSL(hex);
    const shades: string[] = [];

    for (let i = 0; i < steps; i++) {
      const newL = l + (i * (60 / steps));
      shades.push(this.hslToHex(h, s, Math.min(newL, 75))); // cap at 75%
    }
    return shades;
  }

  hexToHSL(hex: string): { h: number, s: number, l: number } {
    hex = hex.replace(/^#/, "");
    let r = parseInt(hex.substring(0, 2), 16) / 255;
    let g = parseInt(hex.substring(2, 4), 16) / 255;
    let b = parseInt(hex.substring(4, 6), 16) / 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  hslToHex(h: number, s: number, l: number): string {
    s /= 100; l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) =>
      l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return "#" + [f(0), f(8), f(4)]
      .map(x => Math.round(x * 255).toString(16).padStart(2, "0"))
      .join("");
  }

generateChartThemeColorRange(): string[] {
  const colors: string[] = [];
  let count = 10; // Number of colors to generate(we show top 10 searches/items in what's trending so making it static 10)
  const primHSL = this.hexToHSL(this.primaryColor);
  const secHSL = this.hexToHSL(this.secondaryColor);

  for (let i = 0; i < count; i++) {
    let ratio = i / (count - 1);

    // Non-linear interpolation for better spacing
    ratio = Math.pow(ratio, 0.6);

    let h = primHSL.h + (secHSL.h - primHSL.h) * ratio;
    let s = primHSL.s + (secHSL.s - primHSL.s) * ratio;
    let l = primHSL.l + (secHSL.l - primHSL.l) * ratio;

    // 🔹 Clamp values to avoid extremes
    s = Math.min(Math.max(s, 30), 90); // saturation between 30–90
    l = Math.min(Math.max(l, 15), 85); // lightness between 15–85

    colors.push(this.hslToHex(h, s, l));
  }
    return colors;
  }

}


