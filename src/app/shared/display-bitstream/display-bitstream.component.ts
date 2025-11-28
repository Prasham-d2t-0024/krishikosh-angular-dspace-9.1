import { AfterViewInit, Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, Input, Inject, PLATFORM_ID } from '@angular/core';
import { filter, map, switchMap, take, tap, timeout, catchError } from 'rxjs/operators';
import { trigger, transition, animate, style } from "@angular/animations";
import { ActivatedRoute, Router, Data, RouterModule } from '@angular/router';
import { hasValue, isNotEmpty } from '../empty.util';
import { getFirstCompletedRemoteData, getFirstSucceededRemoteData, getRemoteDataPayload } from '../../core/shared/operators';
import { Bitstream } from '../../core/shared/bitstream.model';
import { AuthorizationDataService } from '../../core/data/feature-authorization/authorization-data.service';
import { FeatureID } from '../../core/data/feature-authorization/feature-id';
import { AuthService } from '../../core/auth/auth.service';
import { BehaviorSubject, combineLatest as observableCombineLatest, Observable, of as observableOf, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
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
import { FormsModule } from '@angular/forms';
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
    FormsModule,
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
  
  // Chat to Doc - Embedding state
  currentViewingBitstream: Bitstream;
  isEmbedding: boolean = false;
  embeddingProgress: number = 0;
  embeddingStatus: string = '';
  embeddingCompleted: boolean = false;
  embeddingFailed: boolean = false;
  isReadyForChat: boolean = false;
  
  // Chat state
  isChatActive: boolean = false;
  chatMessages: Array<{ text: string; isUser: boolean; timestamp: Date }> = [];
  currentMessage: string = '';
  isSendingMessage: boolean = false;
  
  // Configurable timeout for status API (in milliseconds)
  private readonly STATUS_API_TIMEOUT = 60000; // 60 seconds
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
    @Inject(APP_CONFIG) protected appConfig: AppConfig,
    private http: HttpClient
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
      this.currentFileViewing = this.dsoNameService.getName(this.bistremobj);
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
    // Reset embedding state when switching files
    this.resetEmbeddingState();
    this.bitstreamDataService.findById(event.id).pipe(
      getFirstSucceededRemoteData(),
      getRemoteDataPayload(),
    ).subscribe((response: Bitstream) => {
      this.currentViewingBitstream = response;
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

  /**
   * Get the REST API base URL
   */
  private getRestBaseUrl(): string {
    const rest = this.appConfig.rest;
    return `${rest.baseUrl}/api`;
  }

  /**
   * Reset embedding state
   */
  resetEmbeddingState(): void {
    this.isEmbedding = false;
    this.embeddingProgress = 0;
    this.embeddingStatus = '';
    this.embeddingCompleted = false;
    this.embeddingFailed = false;
    this.isReadyForChat = false;
    // Also reset chat state
    this.isChatActive = false;
    this.chatMessages = [];
    this.currentMessage = '';
    this.isSendingMessage = false;
  }

  /**
   * Embed the currently viewing document
   */
  embedDocument(): void {
    if (!this.currentViewingBitstream && !this.bistremobj) {
      this.notificationsService.error(
        this.translateService.instant('display-bitstream.embed.error'),
        'No document selected for embedding'
      );
      return;
    }

    const bitstream = this.currentViewingBitstream || this.bistremobj;
    const uuid = bitstream.uuid || bitstream.id;
    const baseUrl = this.getRestBaseUrl();
    const embedUrl = `${baseUrl}/aillm/document/upload/${uuid}`;

    this.isEmbedding = true;
    this.embeddingProgress = 0;
    this.embeddingStatus = 'pending';
    this.embeddingCompleted = false;
    this.embeddingFailed = false;

    // ============================================================
    // TESTING MODE: Bypass API call for positive flow testing
    // TODO: Uncomment the real API call below and remove this mock section
    // ============================================================
    console.log('[TEST MODE] Bypassing embed API call. URL would be:', embedUrl);
    // Simulate successful upload response after 1 second
    setTimeout(() => {
      this.embeddingStatus = 'processing';
      this.embeddingProgress = 50;
      this.cdRef.detectChanges();
      
      // Simulate status check success after another 1 second
      setTimeout(() => {
        this.isEmbedding = false;
        this.embeddingCompleted = true;
        this.embeddingProgress = 100;
        this.embeddingStatus = 'completed';
        this.isReadyForChat = true;
        this.notificationsService.success(
          this.translateService.instant('display-bitstream.embed.success'),
          'Document embedded successfully'
        );
        this.cdRef.detectChanges();
      }, 1000);
    }, 1000);
    return; // Exit early, skip real API call
    // ============================================================
    // END TESTING MODE
    // ============================================================

    // ============================================================
    // REAL API CALL - Uncomment this section for real API call
    // ============================================================
    // // Make POST request to embed the document
    // this.http.post<{ status?: string; message?: string }>(embedUrl, {}).subscribe({
    //   next: (response: any) => {
    //     // Check if upload response has error status
    //     if (response?.status === 'error') {
    //       console.error('Upload API returned error:', response);
    //       this.isEmbedding = false;
    //       this.embeddingFailed = true;
    //       this.embeddingStatus = 'error';
    //       this.notificationsService.error(
    //         this.translateService.instant('display-bitstream.embed.error'),
    //         response?.message || 'Document upload failed'
    //       );
    //       this.cdRef.detectChanges();
    //       return; // Don't call status API
    //     }
    //     // Upload succeeded, now check status with timeout
    //     this.checkEmbeddingStatus(uuid);
    //   },
    //   error: (error) => {
    //     console.error('Error embedding document:', error);
    //     this.isEmbedding = false;
    //     this.embeddingFailed = true;
    //     this.embeddingStatus = 'failed';
    //     this.notificationsService.error(
    //       this.translateService.instant('display-bitstream.embed.error'),
    //       error.message || 'Failed to embed document'
    //     );
    //     this.cdRef.detectChanges();
    //   }
    // });
    // ============================================================
    // END REAL API CALL
    // ============================================================
  }

  /**
   * Check embedding status with timeout
   * NOTE: This method is bypassed during testing mode
   * Uncomment the real API call in embedDocument() to use this method
   */
  private checkEmbeddingStatus(uuid: string): void {
    const baseUrl = this.getRestBaseUrl();
    const statusUrl = `${baseUrl}/aillm/document/upload/status/${uuid}`;

    this.http.get<{ progress: number; status: string }>(statusUrl).pipe(
      timeout(this.STATUS_API_TIMEOUT),
      catchError((error) => {
        if (error.name === 'TimeoutError') {
          return throwError(() => new Error('Status check timed out. Please try again.'));
        }
        return throwError(() => error);
      })
    ).subscribe({
      next: (response) => {
        this.embeddingProgress = response.progress;
        this.embeddingStatus = response.status;
        this.isEmbedding = false;

        if (response.status === 'completed' || response.status === 'success' || response.progress >= 100) {
          this.embeddingCompleted = true;
          this.embeddingProgress = 100;
          this.isReadyForChat = true;
          this.notificationsService.success(
            this.translateService.instant('display-bitstream.embed.success'),
            'Document embedded successfully'
          );
        } else if (response.status === 'failed' || response.status === 'error') {
          this.embeddingFailed = true;
          this.isReadyForChat = false;
          this.notificationsService.error(
            this.translateService.instant('display-bitstream.embed.error'),
            'Document embedding failed'
          );
        } else {
          // Status is processing or pending - mark as failed since we're not polling
          this.embeddingFailed = true;
          this.isReadyForChat = false;
          this.embeddingStatus = response.status || 'unknown';
          this.notificationsService.warning(
            this.translateService.instant('display-bitstream.embed.warning'),
            `Embedding status: ${response.status}. Please try again later.`
          );
        }
        this.cdRef.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching embedding status:', error);
        this.isEmbedding = false;
        this.embeddingFailed = true;
        this.isReadyForChat = false;
        this.embeddingStatus = 'timeout';
        this.notificationsService.error(
          this.translateService.instant('display-bitstream.embed.error'),
          error.message || 'Failed to check embedding status (timeout)'
        );
        this.cdRef.detectChanges();
      }
    });
  }

  /**
   * Retry embedding after failure
   */
  retryEmbedding(): void {
    this.resetEmbeddingState();
    this.embedDocument();
  }

  /**
   * Start chatting with the embedded document
   */
  startChatting(): void {
    if (!this.isReadyForChat) {
      this.notificationsService.warning(
        this.translateService.instant('display-bitstream.chat.warning'),
        'Document must be embedded before chatting'
      );
      return;
    }

    // Open chat UI within the tab
    this.isChatActive = true;
    this.chatMessages = [];
    this.currentMessage = '';
    this.cdRef.detectChanges();
  }

  /**
   * Close chat and go back to embedding view
   */
  closeChat(): void {
    this.isChatActive = false;
    this.cdRef.detectChanges();
  }

  /**
   * Send a chat message
   */
  sendMessage(): void {
    if (!this.currentMessage.trim() || this.isSendingMessage) {
      return;
    }

    const bitstream = this.currentViewingBitstream || this.bistremobj;
    const uuid = bitstream?.uuid || bitstream?.id;
    
    if (!uuid) {
      this.notificationsService.error(
        this.translateService.instant('display-bitstream.chat.error'),
        'No document selected'
      );
      return;
    }

    const userMessage = this.currentMessage.trim();
    
    // Add user message to chat
    this.chatMessages.push({
      text: userMessage,
      isUser: true,
      timestamp: new Date()
    });
    
    this.currentMessage = '';
    this.isSendingMessage = true;
    this.cdRef.detectChanges();

    const baseUrl = this.getRestBaseUrl();
    const chatUrl = `${baseUrl}/aillm/chat/stream/${uuid}`;

    // ============================================================
    // TESTING MODE: Bypass API call for chat testing
    // TODO: Uncomment the real API call below and remove this mock section
    // ============================================================
    console.log('[TEST MODE] Bypassing chat API call. URL would be:', chatUrl);
    console.log('[TEST MODE] User message:', userMessage);
    
    // Simulate AI response after 1 second
    setTimeout(() => {
      this.chatMessages.push({
        // text: `This is a mock response to: "${userMessage}". The actual API endpoint is: ${chatUrl}`,
        text: `This is a mock response ...".`,
        isUser: false,
        timestamp: new Date()
      });
      this.isSendingMessage = false;
      this.cdRef.detectChanges();
    }, 1000);
    return; // Exit early, skip real API call
    // ============================================================
    // END TESTING MODE
    // ============================================================

    // ============================================================
    // REAL API CALL - Uncomment this section for real API call
    // ============================================================
    // this.http.post<{ response: string }>(chatUrl, { message: userMessage }).subscribe({
    //   next: (response) => {
    //     this.chatMessages.push({
    //       text: response.response || 'No response received',
    //       isUser: false,
    //       timestamp: new Date()
    //     });
    //     this.isSendingMessage = false;
    //     this.cdRef.detectChanges();
    //   },
    //   error: (error) => {
    //     console.error('Error sending chat message:', error);
    //     this.chatMessages.push({
    //       text: 'Sorry, there was an error processing your message. Please try again.',
    //       isUser: false,
    //       timestamp: new Date()
    //     });
    //     this.isSendingMessage = false;
    //     this.notificationsService.error(
    //       this.translateService.instant('display-bitstream.chat.error'),
    //       error.message || 'Failed to send message'
    //     );
    //     this.cdRef.detectChanges();
    //   }
    // });
    // ============================================================
    // END REAL API CALL
    // ============================================================
  }

  /**
   * Handle Enter key press in chat input
   */
  onChatKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * Cleanup on component destroy
   */
  ngOnDestroy(): void {
    // No cleanup needed since we removed polling
  }
  
}
