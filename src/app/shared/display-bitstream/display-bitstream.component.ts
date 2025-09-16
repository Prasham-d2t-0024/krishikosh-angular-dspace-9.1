import { AfterViewInit, Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, Input, Inject, PLATFORM_ID } from '@angular/core';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { trigger, transition, animate, style } from "@angular/animations";
import { ActivatedRoute, Router, Data, RouterModule } from '@angular/router';
import { hasValue, isNotEmpty } from '../empty.util';
import { getFirstCompletedRemoteData, getFirstSucceededRemoteData, getRemoteDataPayload } from '../../core/shared/operators';
import { Bitstream } from '../../core/shared/bitstream.model';
import { AuthorizationDataService } from '../../core/data/feature-authorization/authorization-data.service';
import { FeatureID } from '../../core/data/feature-authorization/feature-id';
import { AuthService } from '../../core/auth/auth.service';
import { BehaviorSubject, combineLatest as observableCombineLatest, Observable, of as observableOf } from 'rxjs';
import { FileService } from '../../core/shared/file.service';
import { HardRedirectService } from '../../core/services/hard-redirect.service';
import { getForbiddenRoute } from '../../app-routing-paths';
import { RemoteData } from '../../core/data/remote-data';
import { Item } from '../../core/shared/item.model';
import { ItemDataService } from '../../core/data/item-data.service';

// import { ITEM_PAGE_LINKS_TO_FOLLOW } from '../../item-page/item.resolver';
import { getItemPageLinksToFollow } from '../../item-page/item.resolver';

import { followLink } from '../../shared/utils/follow-link-config.model';

import { BitstreamDataService } from '../../core/data/bitstream-data.service';
import { PaginatedList } from '../../core/data/paginated-list.model';
import { NotificationsService } from '../../shared/notifications/notifications.service';
import { TranslateService } from '@ngx-translate/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { NgbNavChangeEvent, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { DSONameService } from 'src/app/core/breadcrumbs/dso-name.service';
import { URLCombiner } from 'src/app/core/url-combiner/url-combiner';
import { PaginationComponentOptions } from '../pagination/pagination-component-options.model';
import { PaginationService } from 'src/app/core/pagination/pagination.service';
import { APP_CONFIG, AppConfig } from 'src/config/app-config.interface';
import { th } from 'date-fns/locale';
import { ShowItemMetadataComponent } from './show-item-metadata/show-item-metadata.component';
import { BrowserModule } from '@angular/platform-browser';
import { TruncatablePartComponent } from '../truncatable/truncatable-part/truncatable-part.component';
import { TruncatableComponent } from '../truncatable/truncatable.component';
import { PdfJsViewerModule } from 'ng2-pdfjs-viewer';
@Component({
  selector: 'ds-display-bitstream',
  templateUrl: './display-bitstream.component.html',
  styleUrls: ['./display-bitstream.component.scss'],
  standalone:true,
  imports:[
    ShowItemMetadataComponent,
    CommonModule,
    TruncatablePartComponent,
    TruncatableComponent,
    RouterModule,
    PdfJsViewerModule,
    NgbNavModule
  ],
  animations: [
    trigger("slideInOut", [
      transition(":enter", [
        style({ transform: "translateX(-100%)" }),
        animate("200ms ease-in", style({ transform: "translateX(0%)" })),
      ]),
    ]),
    trigger("slideOutIn", [
      transition(":enter", [
        style({ transform: "translateX(100%)" }),
        animate("200ms ease-in", style({ transform: "translateX(0)" })),
      ]),
    ]),
  ],
})
export class DisplayBitstreamComponent implements OnInit, AfterViewInit {
  @ViewChild('pdfViewer') public pdfViewer;
  itemRD$: BehaviorSubject<RemoteData<Item>>;
  itemTab: Item;
  @Input() isBlank: Boolean = false;
  firsttime = false;

  /**
   * The ID of the item the bitstream originates from
   * Taken from the current query parameters when present
   * This will determine the route of the item edit page to return to
   */
  bitstreams$: BehaviorSubject<Bitstream[]>;
  itemid: string;
  bitstreamRD$: Observable<RemoteData<Bitstream>>;
  bistremobj: Bitstream;
  filepath: any="";
  fullright = false;
  fullleft = false;
  leftOpen = true;
  active:number = 2;
  originals$: Observable<RemoteData<PaginatedList<Bitstream>>>;
  licenses$: Observable<RemoteData<PaginatedList<Bitstream>>>;
  originalOptions = Object.assign(new PaginationComponentOptions(), {
    id: 'obo',
    currentPage: 1,
    pageSize: this.appConfig.item.bitstream.pageSize
  });
  
  licenseOptions = Object.assign(new PaginationComponentOptions(), {
    id: 'lbo',
    currentPage: 1,
    pageSize: this.appConfig.item.bitstream.pageSize
  });
  currentFileViewing:string;
  pdfUrl:any;
  ITEM_PAGE_LINKS_TO_FOLLOW = getItemPageLinksToFollow();
  constructor(
    private route: ActivatedRoute,
    protected router: Router,
    private authorizationService: AuthorizationDataService,
    @Inject(PLATFORM_ID) private platformId: any,
    private fileService: FileService,
    private hardRedirectService: HardRedirectService,
    private itemService: ItemDataService,
    protected bitstreamDataService: BitstreamDataService,
    protected notificationsService: NotificationsService,
    protected translateService: TranslateService,
    public dsoNameService: DSONameService,
    private auth: AuthService,
    private cdRef: ChangeDetectorRef,
    protected paginationService: PaginationService,
    @Inject(APP_CONFIG) protected appConfig: AppConfig
  ) {
    
  }
  public callme(): void {
    this.route.data.subscribe((data: Data) => {
     // console.log("BISTREMA>>>>>>>>>,", data)
      //this.bistremobj = null;
      fetch(this.bistremobj?._links?.content?.href + '&isDownload=true')
        .then(res => res.blob())   // get response as a Blob
        .then(blob => {
          console.log('PDF Blob:', blob);
          // do something with the blob (set pdfSrc, save, etc.)
        })
        .catch(err => console.error('Fetch error:', err));
      this.bistremobj = data.bitstream.payload;
      this.pdfViewer.pdfSrc = this.bistremobj._links.content.href + '?isDownload=true'; // pdfSrc can be Blob or Uint8Array
        this.pdfViewer.refresh(); 
      // Ask pdf viewer to load/refresh pdf
      this.cdRef.detectChanges();

    })

  }
  ngOnInit(): void {
    // window.oncontextmenu = function () {
    //   return false;
    // }
    this.route.queryParams.subscribe((params) => {
      if (hasValue(params.itemid)) {
        this.itemid = params.itemid;
        const itemRD$ = this.itemService.findById(this.itemid,
          true,
          true, ...this.ITEM_PAGE_LINKS_TO_FOLLOW
        ).pipe(
          getFirstCompletedRemoteData(),
        );
        this.cdRef.detectChanges();
        itemRD$.subscribe((itemRD) => {
          this.itemTab = itemRD.payload;
          this.initialize();
          this.cdRef.detectChanges();
        });
      }
    })
    //   this.router.routeReuseStrategy.shouldReuseRoute = function() {
    //     return false;
    // };
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.route.params.subscribe((params) => {

        this.callme()
      });
    }
  }
  clickHandler(event: any) {
    console.log(event.node.data.id)
  }

  fullleftC() {
    this.leftOpen = !this.leftOpen;
  }
  printFile:any;
  showpdf(event:any) {
    this.currentFileViewing = this.dsoNameService.getName(event);
    this.bitstreamDataService.findById(event.id).pipe(
      getFirstSucceededRemoteData(),
      getRemoteDataPayload(),
    ).subscribe((response: Bitstream) => {
      this.authorizationService.isAuthorized(FeatureID.CanDownload, isNotEmpty(response) ? response.self : undefined)
      this.auth.getShortlivedToken().pipe(take(1), map((token) =>
        hasValue(token) ? new URLCombiner(response._links.content.href, `?authentication-token=${token}`).toString() : response._links.content.href)).subscribe((logs: string) => {
          this.printFile = logs;
          this.pdfViewer.pdfSrc = logs; // pdfSrc can be Blob or Uint8Array
          this.pdfViewer.refresh();
          fetch(logs + '&isDownload=true')
            .then(res => res.blob())   // get response as a Blob
            .then(blob => {
              console.log('PDF Blob:', blob);
              // do something with the blob (set pdfSrc, save, etc.)
            })
            .catch(err => console.error('Fetch error:', err));

          this.cdRef.detectChanges(); // Ask pdf viewer to load/refresh pdf
        });
    });
  }

  initialize(): void {
    this.originals$ = this.paginationService.getCurrentPagination(this.originalOptions.id, this.originalOptions).pipe(
      switchMap((options: PaginationComponentOptions) => this.bitstreamDataService.findAllByItemAndBundleName(
        this.itemTab ,
        'ORIGINAL',
        {elementsPerPage: options.pageSize, currentPage: options.currentPage},
        true,
        true,
        followLink('format'),
        followLink('thumbnail'),
      )),
      tap((rd: RemoteData<PaginatedList<Bitstream>>) => {
          if (hasValue(rd.errorMessage)) {
            this.notificationsService.error(this.translateService.get('file-section.error.header'), `${rd.statusCode} ${rd.errorMessage}`);
          }
        }
      )
    );
    this.originals$.subscribe((data)=>{
      console.log(data);
    })
    this.licenses$ = this.paginationService.getCurrentPagination(this.licenseOptions.id, this.licenseOptions).pipe(
      switchMap((options: PaginationComponentOptions) => this.bitstreamDataService.findAllByItemAndBundleName(
        this.itemTab,
        'LICENSE',
        {elementsPerPage: options.pageSize, currentPage: options.currentPage},
        true,
        true,
        followLink('format'),
        followLink('thumbnail'),
      )),
      tap((rd: RemoteData<PaginatedList<Bitstream>>) => {
          if (hasValue(rd.errorMessage)) {
            this.notificationsService.error(this.translateService.get('file-section.error.header'), `${rd.statusCode} ${rd.errorMessage}`);
          }
        }
      )
    );

  }

  onNavChange(changeEvent: NgbNavChangeEvent) {
  }

  downloadPdf(file: any) {
    this.bitstreamDataService.findById(file.id).pipe(
      getFirstSucceededRemoteData(),
      getRemoteDataPayload(),
    ).subscribe((response: Bitstream) => {
      this.authorizationService.isAuthorized(
        FeatureID.CanDownload,
        isNotEmpty(response) ? response.self : undefined
      );
      
      this.auth.getShortlivedToken().pipe(
        take(1),
        map((token) =>
          hasValue(token)
            ? new URLCombiner(response._links.content.href, `?authentication-token=${token}`).toString()
            : response._links.content.href
        )
      ).subscribe((url: string) => {
        // Fetch the file as a blob
        fetch(url)
          .then(res => res.blob())
          .then(blob => {
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = this.dsoNameService.getName(file); // Desired filename
            document.body.appendChild(link); // Append to body for compatibility
            link.click();
            document.body.removeChild(link); // Cleanup
            URL.revokeObjectURL(downloadUrl); // Free up memory
          })
          .catch(error => {
            console.error('Error fetching or downloading the file:', error);
            alert('Failed to download the file. Please try again later.');
          });
      });
    });
  }
  
}
