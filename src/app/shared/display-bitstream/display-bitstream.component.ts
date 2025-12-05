import { AfterViewInit, Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, Input, Inject, PLATFORM_ID, isDevMode } from '@angular/core';
import { filter, map, switchMap, take, tap, timeout, catchError } from 'rxjs/operators';
import { trigger, transition, animate, style } from "@angular/animations";
import { ActivatedRoute, Router, Data, RouterModule } from '@angular/router';
import { hasValue, isNotEmpty } from '../empty.util';
import { getFirstCompletedRemoteData, getFirstSucceededRemoteData, getRemoteDataPayload } from '../../core/shared/operators';
import { Bitstream } from '../../core/shared/bitstream.model';
import { AuthorizationDataService } from '../../core/data/feature-authorization/authorization-data.service';
import { FeatureID } from '../../core/data/feature-authorization/feature-id';
import { AuthService } from '../../core/auth/auth.service';
import { BehaviorSubject, combineLatest as observableCombineLatest, Observable, of as observableOf, throwError, forkJoin, Subscription } from 'rxjs';
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

/**
 * Interface for PDF state management
 * This structure may change in the future as requirements evolve
 */
export interface PdfState {
  uuid: string;
  name: string;
  status: 'NOT_EMBEDDED' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'LOADING';
  progress: number;
  totalChunks: number;
  processedChunks: number;
  isEmbedding: boolean;
  bitstreamData: Bitstream;
}

/**
 * Interface for the currently selected PDF for chat
 */
export interface CurrentChatPdf {
  uuid: string;
  name: string;
  bitstreamData: Bitstream;
}

/**
 * Interface for chat message with formatting support
 */
export interface ChatMessage {
  text: string;
  formattedHtml?: string;
  isUser: boolean;
  timestamp: Date;
  isStreaming?: boolean;
  sources?: SourceReference[];
}

/**
 * Interface for source references in chat responses
 */
export interface SourceReference {
  sourceId: number;
  page: number;
  documentName: string;
  pdfUid: string;
  contentPreview?: string;
}
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
  isAuthenticated: boolean = false;
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
  
  // PDF States Map - stores state for each PDF by UUID
  pdfStatesMap: Map<string, PdfState> = new Map();
  
  // Current PDF selected for chat
  currentChatPdf: CurrentChatPdf | null = null;
  
  // Flag to show/hide chat panel on the right
  isChatPanelOpen: boolean = false;
  
  // Chat to Doc - Embedding state (kept for backward compatibility, will be removed later)
  currentViewingBitstream: Bitstream;
  isEmbedding: boolean = false;
  embeddingProgress: number = 0;
  embeddingStatus: string = '';
  embeddingCompleted: boolean = false;
  embeddingFailed: boolean = false;
  isReadyForChat: boolean = false;
  
  // Chat state
  isChatActive: boolean = false;
  chatMessages: ChatMessage[] = [];
  currentMessage: string = '';
  isSendingMessage: boolean = false;
  streamingMessageIndex: number = -1;
  
  // Event listener reference for cleanup
  private sourceNavigationListener: EventListener | null = null;
  
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
      fetch(this.bistremobj?._links?.content?.href + '&isDownload=true')
        .then(res => res.blob())   // get response as a Blob
        .then(blob => {
          console.log('PDF Blob:', blob);
        })
        .catch(err => console.error('Fetch error:', err));
      this.bistremobj = data.bitstream.payload;
      this.currentFileViewing = this.dsoNameService.getName(this.bistremobj);
      this.pdfViewer.pdfSrc = this.bistremobj._links.content.href + '?isDownload=true'; // pdfSrc can be Blob or Uint8Array
      this.pdfViewer.refresh(); 
      this.cdRef.detectChanges();
    })
  }
  
  ngOnInit(): void {
    // window.oncontextmenu = function () {
    //   return false;
    // }
    
    // Listen for source navigation events from formatted links
    if (isPlatformBrowser(this.platformId)) {
      this.sourceNavigationListener = ((event: CustomEvent) => {
        this.navigateToSource(event.detail.sourceId);
      }) as EventListener;
      window.addEventListener('navigateToSource', this.sourceNavigationListener);
    }
    
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
          this.auth.isAuthenticated().subscribe((resp)=>{
            this.isAuthenticated = resp;
          });
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
          // Fetch statuses for all PDFs when originals are loaded
          if (rd.payload?.page) {
            this.fetchAllPdfStatuses(rd.payload.page);
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

  /**
   * Fetch statuses for all PDFs in the list
   * Called when originals are loaded
   */
  fetchAllPdfStatuses(files: Bitstream[]): void {
    files.forEach((file) => {
      const uuid = file.uuid || file.id;
      // Initialize with LOADING state
      this.pdfStatesMap.set(uuid, {
        uuid: uuid,
        name: this.dsoNameService.getName(file),
        status: 'LOADING',
        progress: 0,
        totalChunks: 0,
        processedChunks: 0,
        isEmbedding: false,
        bitstreamData: file
      });
      // Fetch status for each PDF
      if(this.isAuthenticated){
        this.fetchPdfStatus(uuid, file);
      }
    });
    this.cdRef.detectChanges();
  }

  /**
   * Fetch status for a single PDF
   * If 404, treat as NOT_EMBEDDED
   */
  fetchPdfStatus(uuid: string, file: Bitstream): void {
    const baseUrl = this.getRestBaseUrl();
    const statusUrl = `${baseUrl}/aillm/document/upload/status/${uuid}`;

    this.http.get<{
      pdf_uid: string;
      status: string;
      total_chunks: number;
      processed_chunks: number;
      progress: number;
      error_message: string | null;
      created_at: string;
      updated_at: string;
    }>(statusUrl).subscribe({
      next: (response) => {
        const status = response?.status?.toUpperCase() as PdfState['status'];
        this.pdfStatesMap.set(uuid, {
          uuid: uuid,
          name: this.dsoNameService.getName(file),
          status: status || 'NOT_EMBEDDED',
          progress: response?.progress || 0,
          totalChunks: response?.total_chunks || 0,
          processedChunks: response?.processed_chunks || 0,
          isEmbedding: status === 'PROCESSING' || status === 'PENDING',
          bitstreamData: file
        });
        this.cdRef.detectChanges();
      },
      error: (error) => {
        // 404 means document not embedded yet
        this.pdfStatesMap.set(uuid, {
          uuid: uuid,
          name: this.dsoNameService.getName(file),
          status: 'NOT_EMBEDDED',
          progress: 0,
          totalChunks: 0,
          processedChunks: 0,
          isEmbedding: false,
          bitstreamData: file
        });
        this.cdRef.detectChanges();
      }
    });
  }

  /**
   * Get PDF state by UUID
   */
  getPdfState(uuid: string): PdfState | undefined {
    return this.pdfStatesMap.get(uuid);
  }

  /**
   * Embed a specific document by file
   */
  embedDocumentByFile(file: Bitstream, event: Event): void {
    event.stopPropagation();
    const uuid = file.uuid || file.id;
    const baseUrl = this.getRestBaseUrl();
    const embedUrl = `${baseUrl}/aillm/document/upload/${uuid}`;

    // Update state to show loading
    const currentState = this.pdfStatesMap.get(uuid);
    if (currentState) {
      currentState.isEmbedding = true;
      currentState.status = 'PENDING';
      currentState.progress = 0;
      this.pdfStatesMap.set(uuid, { ...currentState });
      this.cdRef.detectChanges();
    }

    // Make POST request to embed the document
    this.http.post<{ status?: string; message?: string }>(embedUrl, {}).subscribe({
      next: (response: any) => {
        if (response?.status === 'error') {
          console.error('Upload API returned error:', response);
          if (currentState) {
            currentState.isEmbedding = false;
            currentState.status = 'FAILED';
            this.pdfStatesMap.set(uuid, { ...currentState });
          }
          this.notificationsService.error(
            this.translateService.instant('Failure'),
            response?.message || 'Document upload failed'
          );
          this.cdRef.detectChanges();
          return;
        }
        // Upload succeeded, now poll for status
        // this.pollEmbeddingStatus(uuid, file);
      },
      error: (error) => {
        console.error('Error embedding document:', error);
        if (currentState) {
          currentState.isEmbedding = false;
          currentState.status = 'FAILED';
          this.pdfStatesMap.set(uuid, { ...currentState });
        }
        this.notificationsService.error(
          this.translateService.instant('Failure'),'Failed to embed document'
        );
        this.cdRef.detectChanges();
      }
    });
  }

  /**
   * Poll embedding status until completed or failed
   */
  pollEmbeddingStatus(uuid: string, file: Bitstream): void {
    const baseUrl = this.getRestBaseUrl();
    const statusUrl = `${baseUrl}/aillm/document/upload/status/${uuid}`;

    this.http.get<{
      pdf_uid: string;
      status: string;
      total_chunks: number;
      processed_chunks: number;
      progress: number;
      error_message: string | null;
      created_at: string;
      updated_at: string;
    }>(statusUrl).pipe(
      timeout(this.STATUS_API_TIMEOUT),
      catchError((error) => {
        if (error.name === 'TimeoutError') {
          return throwError(() => new Error('Status check timed out. Please try again.'));
        }
        return throwError(() => error);
      })
    ).subscribe({
      next: (response) => {
        const status = response?.status?.toUpperCase();
        const currentState = this.pdfStatesMap.get(uuid);

        if (status === 'COMPLETED') {
          this.pdfStatesMap.set(uuid, {
            uuid: uuid,
            name: this.dsoNameService.getName(file),
            status: 'COMPLETED',
            progress: 100,
            totalChunks: response.total_chunks,
            processedChunks: response.processed_chunks,
            isEmbedding: false,
            bitstreamData: file
          });
          if(isDevMode()){
            this.notificationsService.success(
              this.translateService.instant('Successful'),
              `Document embedded successfully`
            );
          }else{
            this.notificationsService.success(
              this.translateService.instant('Successful'),
              `Document embedded successfully (${response.total_chunks} chunks processed)`
            );
          }
        } else if (status === 'FAILED') {
          this.pdfStatesMap.set(uuid, {
            uuid: uuid,
            name: this.dsoNameService.getName(file),
            status: 'FAILED',
            progress: response?.progress || 0,
            totalChunks: response?.total_chunks || 0,
            processedChunks: response?.processed_chunks || 0,
            isEmbedding: false,
            bitstreamData: file
          });
          this.notificationsService.error(
            this.translateService.instant('Failure'),
            response.error_message || 'Document embedding failed'
          );
        } 
        // else if (status === 'PROCESSING' || status === 'PENDING') {
        //   // Update progress and continue polling
        //   this.pdfStatesMap.set(uuid, {
        //     uuid: uuid,
        //     name: this.dsoNameService.getName(file),
        //     status: status as PdfState['status'],
        //     progress: response?.progress || 0,
        //     totalChunks: response?.total_chunks || 0,
        //     processedChunks: response?.processed_chunks || 0,
        //     isEmbedding: true,
        //     bitstreamData: file
        //   });
        //   this.cdRef.detectChanges();
        //   // Poll again after 2 seconds
        //   setTimeout(() => {
        //     this.pollEmbeddingStatus(uuid, file);
        //   }, 2000);
        //   return;
        // } 
        else {
          // other status
          this.pdfStatesMap.set(uuid, {
            uuid: uuid,
            name: this.dsoNameService.getName(file),
            status: 'FAILED',
            progress: 0,
            totalChunks: 0,
            processedChunks: 0,
            isEmbedding: false,
            bitstreamData: file
          });
          this.notificationsService.warning(
            this.translateService.instant('Warning'),
            `Unknown embedding status: ${response.status}`
          );
        }
        this.cdRef.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching embedding status:', error);
        this.pdfStatesMap.set(uuid, {
          uuid: uuid,
          name: this.dsoNameService.getName(file),
          status: 'FAILED',
          progress: 0,
          totalChunks: 0,
          processedChunks: 0,
          isEmbedding: false,
          bitstreamData: file
        });
        this.notificationsService.error(
          this.translateService.instant('Failure'),'Failed to check embedding status'
        );
        this.cdRef.detectChanges();
      }
    });
  }

  /**
   * Open chat panel for a specific PDF
   */
  openChatForPdf(file: Bitstream, event:Event): void {
    const uuid = file.uuid || file.id;
    if(this.currentFileViewing == this.dsoNameService.getName(file)){
      event.stopPropagation();
    }
    const pdfState = this.pdfStatesMap.get(uuid);

    if (!pdfState || pdfState.status !== 'COMPLETED') {
      this.notificationsService.warning(
        this.translateService.instant('Warning'),
        'Document must be embedded before chatting'
      );
      return;
    }

    // Set current chat PDF
    this.currentChatPdf = {
      uuid: uuid,
      name: this.dsoNameService.getName(file),
      bitstreamData: file
    };

    // Reset chat messages for new conversation
    this.chatMessages = [];
    this.currentMessage = '';
    this.isSendingMessage = false;

    // Open chat panel
    this.isChatPanelOpen = true;
    this.cdRef.detectChanges();
  }

  /**
   * Close chat panel
   */
  closeChatPanel(): void {
    this.isChatPanelOpen = false;
    this.currentChatPdf = null;
    this.chatMessages = [];
    this.currentMessage = '';
    this.cdRef.detectChanges();
  }

  // Subscription for streaming chat response
  private chatStreamSubscription: Subscription | null = null;

  /**
   * Get cookie value by name
   */
  private getCookie(name: string): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    const cookies = document.cookie.split(';');

    for (let c of cookies) {
      const trimmed = c.trim();
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      
      const key = trimmed.substring(0, eqIndex);
      const value = trimmed.substring(eqIndex + 1);
      
      if (key === name) {
        return decodeURIComponent(value);
      }
    }
    return null;
  }

  /**
   * Get auth token from dsAuthInfo cookie
   * dsAuthInfo contains JSON: {"accessToken":"...", "expires":...}
   */
  private getAuthTokenFromCookie(): string | null {
    const dsAuthInfo = this.getCookie('dsAuthInfo');
    if (!dsAuthInfo) {
      return null;
    }
    
    try {
      const authInfo = JSON.parse(dsAuthInfo);
      return authInfo?.accessToken || null;
    } catch (e) {
      console.error('Error parsing dsAuthInfo cookie:', e);
      return null;
    }
  }

  /**
   * To get CSRF token from the cookies
   * @returns CSRF token string or null if not found
   */
  private getCsrf(): string | null {
    const csrf = this.getCookie('XSRF-TOKEN');
    if (!csrf) {
      return null;
    }
      return csrf;
  }

  /**
   * Send chat message using fetch with SSE/EventStream response
   * Token is retrieved from dsAuthInfo cookie
   */
  sendChatMessage(): void {
    if (!this.currentMessage.trim() || this.isSendingMessage || !this.currentChatPdf) {
      return;
    }

    const uuid = this.currentChatPdf.uuid;
    const userMessage = this.currentMessage.trim();

    // Add user message to chat
    this.chatMessages.push({
      text: userMessage,
      isUser: true,
      timestamp: new Date()
    });

    this.currentMessage = '';
    this.isSendingMessage = true;
    
    // Add a placeholder AI message for streaming
    const aiMessageIndex = this.chatMessages.length;
    this.chatMessages.push({
      text: '',
      formattedHtml: '',
      isUser: false,
      timestamp: new Date(),
      isStreaming: true
    });
    this.streamingMessageIndex = aiMessageIndex;
    this.cdRef.detectChanges();

    const baseUrl = this.getRestBaseUrl();
    const chatUrl = `${baseUrl}/aillm/chat/stream/${uuid}`;

    // Use fetch with SSE for streaming response
    this.fetchSSEChatResponse(chatUrl, userMessage, aiMessageIndex);
  }

  /**
   * Fetch SSE/EventStream chat response using fetch API
   * Gets auth token from dsAuthInfo cookie
   */
  private async fetchSSEChatResponse(url: string, message: string, messageIndex: number): Promise<void> {
    try {
      // Get token from dsAuthInfo cookie (contains JSON with accessToken)
      const token = this.getAuthTokenFromCookie();
      const csrf = this.getCsrf();
      
      // Build headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      if (csrf) {
        headers['X-XSRF-TOKEN'] = `${csrf}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ message: message }),
        credentials: 'include' // Include cookies in request
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      
      // Streaming state - only parse JSON once when marker is found
      let botMsg = '';
      let sourcesJson: SourceReference[] | null = null;
      let foundSourcesMarker = false;

      // Read the stream incrementally
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        let chunk = decoder.decode(value, { stream: true });
        
        // Strip SSE "data:" prefix from each line if present
        // Server sends: "data: actual content\n" - we need just "actual content"
        chunk = chunk.split('\n').map(line => {
          if (line.startsWith('data:')) {
            return line.substring(5).trimStart(); // Remove "data:" and leading space
          }
          if (line.startsWith('data: ')) {
            return line.substring(6); // Remove "data: "
          }
          return line;
        }).filter(line => line.trim() !== '' && line.trim() !== '[DONE]').join('\n');
        
        // Skip empty chunks after stripping
        if (!chunk.trim()) {
          continue;
        }
        
        // Check if this chunk contains the metadata marker
        if (!foundSourcesMarker && chunk.includes('[[[METADATA]]]')) {
          foundSourcesMarker = true;
          const parts = chunk.split('[[[METADATA]]]');
          
          // Left part goes to bot message
          botMsg += parts[0];
          
          // Right part is JSON metadata - parse only once
          if (parts[1]) {
            try {
              const metadata = JSON.parse(parts[1]);
              if (metadata.sources && Array.isArray(metadata.sources)) {
                sourcesJson = metadata.sources.map((src: any) => ({
                  sourceId: src.source_id,
                  page: src.page,
                  documentName: src.document_name,
                  pdfUid: src.pdf_uid,
                  contentPreview: src.content_preview
                }));
              } else if (Array.isArray(metadata)) {
                // Direct array format
                sourcesJson = metadata.map((src: any) => ({
                  sourceId: src.source_id,
                  page: src.page,
                  documentName: src.document_name,
                  pdfUid: src.pdf_uid,
                  contentPreview: src.content_preview
                }));
              }
            } catch (e) {
              console.error('Error parsing sources JSON:', e);
            }
          }
        } else if (!foundSourcesMarker) {
          // No marker yet - accumulate text
          botMsg += chunk;
        }
        // After marker is found, ignore any additional chunks (metadata continuation)

        // Update UI incrementally - only show botMsg, never metadata
        if (this.chatMessages[messageIndex]) {
          this.chatMessages[messageIndex].text = botMsg;
          
          // Format with citations if sources are available
          if (sourcesJson && sourcesJson.length > 0) {
            this.chatMessages[messageIndex].formattedHtml = this.processCitationsInText(botMsg, sourcesJson);
            this.chatMessages[messageIndex].sources = sourcesJson;
          } else {
            this.chatMessages[messageIndex].formattedHtml = this.formatChatResponse(botMsg);
          }
          
          // Trigger change detection for UI update during streaming
          this.cdRef.detectChanges();
        }
      }

      // Final update - mark streaming as complete
      if (this.chatMessages[messageIndex]) {
        this.chatMessages[messageIndex].isStreaming = false;
        this.chatMessages[messageIndex].text = botMsg;
        
        // Final formatting with sources
        if (sourcesJson && sourcesJson.length > 0) {
          this.chatMessages[messageIndex].formattedHtml = this.processCitationsInText(botMsg, sourcesJson);
          this.chatMessages[messageIndex].sources = sourcesJson;
        } else {
          this.chatMessages[messageIndex].formattedHtml = this.formatChatResponse(botMsg);
        }
      }

      this.isSendingMessage = false;
      this.streamingMessageIndex = -1;
      this.cdRef.detectChanges();

    } catch (error) {
      console.error('Error in SSE chat response:', error);
      
      if (this.chatMessages[messageIndex]) {
        this.chatMessages[messageIndex].text = 'Sorry, there was an error processing your message. Please try again.';
        this.chatMessages[messageIndex].formattedHtml = 'Sorry, there was an error processing your message. Please try again.';
        this.chatMessages[messageIndex].isStreaming = false;
      }

      this.isSendingMessage = false;
      this.streamingMessageIndex = -1;
      this.notificationsService.error(
        this.translateService.instant('Error'),
        'Failed to send message'
      );
      this.cdRef.detectChanges();
    }
  }

  /**
   * Parse response and extract metadata/sources
   */
  private parseResponseWithMetadata(text: string): { content: string; sources: SourceReference[] } {
    const metadataSeparator = '[[[METADATA]]]';
    const separatorIndex = text.indexOf(metadataSeparator);
    
    if (separatorIndex === -1) {
      return { content: text, sources: [] };
    }

    const content = text.substring(0, separatorIndex).trim();
    const metadataStr = text.substring(separatorIndex + metadataSeparator.length).trim();

    let sources: SourceReference[] = [];
    try {
      const metadata = JSON.parse(metadataStr);
      if (metadata.sources && Array.isArray(metadata.sources)) {
        sources = metadata.sources.map((src: any) => ({
          sourceId: src.source_id,
          page: src.page,
          documentName: src.document_name,
          pdfUid: src.pdf_uid,
          contentPreview: src.content_preview
        }));
      }
    } catch (e) {
      console.error('Error parsing metadata:', e);
    }

    return { content, sources };
  }

  /**
   * Process citations in text using sources metadata
   * This method formats the bot message and injects clickable citation links
   * based on the sources JSON received after [[[METADATA]]] marker
   * 
   * Handles multiple formats:
   * - [1], [2] -> clickable links
   * - (source 1, 2, 3) -> converted to [1], [2], [3] clickable links
   * - [Source X] -> converted to [X] clickable link
   * 
   * On click: updates pdfViewer.pdfSrc with #page=X and refreshes viewer
   * 
   * @param text - The bot message text (without metadata)
   * @param sources - Array of source references from metadata
   * @returns Formatted HTML with clickable citations
   */
  private processCitationsInText(text: string, sources: SourceReference[]): string {
    if (!text) return '';

    let formatted = text;

    // First, convert (source X, Y, Z) pattern to [X], [Y], [Z] format BEFORE escaping HTML
    // This handles formats like: (source 1, 2, 3) or (source 1,2,3) or (Source 1, 12, 13)
    formatted = formatted.replace(/\(source\s+([\d,\s]+)\)/gi, (match, sourceNumbers) => {
      const numbers = sourceNumbers.split(',').map((n: string) => n.trim()).filter((n: string) => n);
      return numbers.map((num: string) => `[${num}]`).join(' ');
    });

    // Escape HTML to prevent XSS
    formatted = formatted
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Format bold: **text** -> <strong>text</strong>
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Format italic: *text* -> <em>text</em> (but not ** which is bold)
    formatted = formatted.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');

    // Replace citation markers [1], [2], etc. with clickable links using sources data
    formatted = formatted.replace(/\[(\d+)\]/g, (match, num) => {
      const sourceId = parseInt(num, 10);
      const source = sources.find(s => s.sourceId === sourceId);
      
      if (source) {
        // Create clickable citation link with page info
        // Escape quotes in content preview for tooltip
        const escapedPreview = source.contentPreview 
          ? source.contentPreview.substring(0, 100).replace(/"/g, '&quot;').replace(/'/g, '&#39;')
          : '';
        const tooltip = escapedPreview 
          ? `Page ${source.page}: ${escapedPreview}...`
          : `Go to page ${source.page}`;
        return `<a href="javascript:void(0)" class="source-link citation-link" 
                   data-source="${sourceId}" 
                   data-page="${source.page}"
                   title="${tooltip}"
                   onclick="window.dispatchEvent(new CustomEvent('navigateToSource', {detail: {sourceId: ${sourceId}}}))">[${sourceId}]</a>`;
      }
      return match; // Return original if no source found
    });

    // Also handle [Source X] format (convert to just [X] link)
    formatted = formatted.replace(/\[Source\s+(\d+)\]/gi, (match, num) => {
      const sourceId = parseInt(num, 10);
      const source = sources.find(s => s.sourceId === sourceId);
      
      if (source) {
        const escapedPreview = source.contentPreview 
          ? source.contentPreview.substring(0, 100).replace(/"/g, '&quot;').replace(/'/g, '&#39;')
          : '';
        const tooltip = escapedPreview 
          ? `Page ${source.page}: ${escapedPreview}...`
          : `Go to page ${source.page}`;
        return `<a href="javascript:void(0)" class="source-link citation-link" 
                   data-source="${sourceId}" 
                   data-page="${source.page}"
                   title="${tooltip}"
                   onclick="window.dispatchEvent(new CustomEvent('navigateToSource', {detail: {sourceId: ${sourceId}}}))">[${sourceId}]</a>`;
      }
      return match;
    });

    // Format bullet points: lines starting with * or -
    formatted = formatted.replace(/^[\*\-]\s+(.+)$/gm, '<li>$1</li>');
    
    // Wrap consecutive <li> items in <ul>
    formatted = formatted.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
      return '<ul class="chat-list">' + match + '</ul>';
    });

    // Convert newlines to <br> for non-list content
    formatted = formatted.replace(/\n/g, '<br>');

    // Clean up extra <br> around lists
    formatted = formatted.replace(/<br><ul/g, '<ul');
    formatted = formatted.replace(/<\/ul><br>/g, '</ul>');

    return formatted;
  }

  /**
   * Format chat response with markdown-like formatting
   * - *text* = italic
   * - **text** = bold
   * - [Source X] = clickable link to PDF page
   * - Bullet points
   */
  formatChatResponse(text: string): string {
    if (!text) return '';

    let formatted = text;

    // Escape HTML first to prevent XSS
    formatted = formatted
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Format bold: **text** -> <strong>text</strong>
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Format italic: *text* -> <em>text</em> (but not ** which is bold)
    formatted = formatted.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');

    // Format source references: [Source X] or [Sources X, Y, Z]
    formatted = this.formatSourceReferences(formatted);

    // Format bullet points: lines starting with * or -
    formatted = formatted.replace(/^[\*\-]\s+(.+)$/gm, '<li>$1</li>');
    
    // Wrap consecutive <li> items in <ul>
    formatted = formatted.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
      return '<ul class="chat-list">' + match + '</ul>';
    });

    // Convert newlines to <br> for non-list content
    formatted = formatted.replace(/\n/g, '<br>');

    // Clean up extra <br> around lists
    formatted = formatted.replace(/<br><ul/g, '<ul');
    formatted = formatted.replace(/<\/ul><br>/g, '</ul>');

    return formatted;
  }

  /**
   * Format source references with clickable links
   * [Source X] -> link to PDF page
   */
  private formatSourceReferences(text: string): string {
    // Match [Source X] or [Sources X, Y, Z]
    const sourcePattern = /\[Sources?\s+([\d,\s]+)\]/gi;
    
    return text.replace(sourcePattern, (match, sourceNumbers) => {
      const numbers = sourceNumbers.split(',').map((n: string) => n.trim());
      const links = numbers.map((num: string) => {
        const sourceId = parseInt(num, 10);
        return `<a href="javascript:void(0)" class="source-link" data-source="${sourceId}" onclick="window.dispatchEvent(new CustomEvent('navigateToSource', {detail: {sourceId: ${sourceId}}}))">[${sourceId}]</a>`;
      });
      return links.join(', ');
    });
  }

  /**
   * Get PDF URL for a specific page
   */
  getPdfPageUrl(page: number): string {
    if (!this.currentChatPdf?.bitstreamData?._links?.content?.href) {
      return '#';
    }
    return `${this.currentChatPdf.bitstreamData._links.content.href}#page=${page}`;
  }

  /**
   * Navigate to a specific page in the PDF by updating pdfViewer.pdfSrc with #page=X
   * This method finds the source by sourceId from chat messages, extracts the page number,
   * and updates the PDF viewer URL to navigate to that page.
   * 
   * @param sourceId - The source_id from metadata to navigate to
   */
  navigateToSource(sourceId: number): void {
    // Find the message that contains sources
    const currentMessage = this.chatMessages.find(m => m.sources && m.sources.length > 0);
    if (!currentMessage?.sources) return;

    // Find the source by source_id (using key name, not ordering)
    const source = currentMessage.sources.find(s => s.sourceId === sourceId);
    if (source && this.pdfViewer) {
      // Get current pdfSrc
      let currentPdfSrc = this.pdfViewer.pdfSrc || '';
      
      // Remove any existing #page= fragment
      const hashIndex = currentPdfSrc.indexOf('#page=');
      if (hashIndex !== -1) {
        currentPdfSrc = currentPdfSrc.substring(0, hashIndex);
      }
      
      // Also remove any other hash fragment that might exist
      const otherHashIndex = currentPdfSrc.indexOf('#');
      if (otherHashIndex !== -1) {
        currentPdfSrc = currentPdfSrc.substring(0, otherHashIndex);
      }
      
      // Append #page={page_number} from the source metadata
      const newPdfSrc = `${currentPdfSrc}#page=${source.page}`;
      
      // Update pdfViewer.pdfSrc and refresh to navigate to that page
      this.pdfViewer.pdfSrc = newPdfSrc;
      this.pdfViewer.refresh();
      this.cdRef.detectChanges();
    }
  }

  /**
   * Handle Enter key press in chat input (for new chat panel)
   */
  onChatPanelKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendChatMessage();
    }
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
        this.translateService.instant('Failure'),
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
    // TESTING MODE: Bypass API call for positive flow testing (DISABLED)
    // ============================================================
    // console.log('[TEST MODE] Bypassing embed API call. URL would be:', embedUrl);
    // // Simulate successful upload response after 1 second
    // setTimeout(() => {
    //   this.embeddingStatus = 'processing';
    //   this.embeddingProgress = 50;
    //   this.cdRef.detectChanges();
    //   
    //   // Simulate status check success after another 1 second
    //   setTimeout(() => {
    //     this.isEmbedding = false;
    //     this.embeddingCompleted = true;
    //     this.embeddingProgress = 100;
    //     this.embeddingStatus = 'completed';
    //     this.isReadyForChat = true;
    //     this.notificationsService.success(
    //       this.translateService.instant('display-bitstream.embed.success'),
    //       'Document embedded successfully'
    //     );
    //     this.cdRef.detectChanges();
    //   }, 1000);
    // }, 1000);
    // return; // Exit early, skip real API call
    // ============================================================
    // END TESTING MODE
    // ============================================================

    // ============================================================
    // REAL API CALL - Enabled
    // ============================================================
    // Make POST request to embed the document
    this.http.post<{ status?: string; message?: string }>(embedUrl, {}).subscribe({
      next: (response: any) => {
        // Check if upload response has error status
        if (response?.status === 'error') {
          console.error('Upload API returned error:', response);
          this.isEmbedding = false;
          this.embeddingFailed = true;
          this.embeddingStatus = 'error';
          this.notificationsService.error(
            this.translateService.instant('Failure'),
            response?.message || 'Document upload failed'
          );
          this.cdRef.detectChanges();
          return; // Don't call status API
        }
        // Upload succeeded, now check status with timeout
        this.checkEmbeddingStatus(uuid);
      },
      error: (error) => {
        console.error('Error embedding document:', error);
        this.isEmbedding = false;
        this.embeddingFailed = true;
        this.embeddingStatus = 'failed';
        this.notificationsService.error(
          this.translateService.instant('Failure'),
          error.message || 'Failed to embed document'
        );
        this.cdRef.detectChanges();
      }
    });
    // ============================================================
    // END REAL API CALL
    // ============================================================
  }

  /**
   * Check embedding status with timeout
   */
  private checkEmbeddingStatus(uuid: string): void {
    const baseUrl = this.getRestBaseUrl();
    const statusUrl = `${baseUrl}/aillm/document/upload/status/${uuid}`;

    this.http.get<{
      pdf_uid: string;
      status: string;
      total_chunks: number;
      processed_chunks: number;
      progress: number;
      error_message: string | null;
      created_at: string;
      updated_at: string;
    }>(statusUrl).pipe(
      timeout(this.STATUS_API_TIMEOUT),
      catchError((error) => {
        if (error.name === 'TimeoutError') {
          return throwError(() => new Error('Status check timed out. Please try again.'));
        }
        return throwError(() => error);
      })
    ).subscribe({
      next: (response) => {
        this.embeddingProgress = response?.progress;
        this.embeddingStatus = response?.status;

        // Normalize status to uppercase for comparison
        const status = response?.status?.toUpperCase();

        if (status === 'COMPLETED') {
          this.isEmbedding = false;
          this.embeddingCompleted = true;
          this.embeddingProgress = 100;
          this.isReadyForChat = true;
          this.notificationsService.success(
            this.translateService.instant('display-bitstream.embed.success'),
            `Document embedded successfully (${response.total_chunks} chunks processed)`
          );
        } else if (status === 'FAILED') {
          this.isEmbedding = false;
          this.embeddingFailed = true;
          this.isReadyForChat = false;
          this.notificationsService.error(
            this.translateService.instant('Failure'),
            response.error_message || 'Document embedding failed'
          );
        } 
        // else if (status === 'PROCESSING' || status === 'PENDING') {
        //   // Keep isEmbedding true to show loading state
        //   this.isEmbedding = true;
        //   this.embeddingProgress = response?.progress;
        //   this.embeddingStatus = status === 'PROCESSING' ? 'processing' : 'pending';
        //   this.cdRef.detectChanges();
        //   // Poll again after 2 seconds
        //   setTimeout(() => {
        //     this.checkEmbeddingStatus(uuid);
        //   }, 2000);
        // } 
        else {
          this.isEmbedding = false;
          this.embeddingFailed = true;
          this.isReadyForChat = false;
          this.embeddingStatus = response.status || 'unknown';
          this.notificationsService.warning(
            this.translateService.instant('display-bitstream.embed.warning'),
            `Unknown embedding status: ${response.status}`
          );
        }
        this.cdRef.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching embedding status:', error);
        this.isEmbedding = false;
        this.embeddingFailed = true;
        this.isReadyForChat = false;
        this.embeddingStatus = 'error';
        this.notificationsService.error(
          this.translateService.instant('Failure'),
          error.message || 'Failed to check embedding status'
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
        this.translateService.instant('Warning'),
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
    // TESTING MODE: Bypass API call for chat testing (DISABLED)
    // ============================================================
    // console.log('[TEST MODE] Bypassing chat API call. URL would be:', chatUrl);
    // console.log('[TEST MODE] User message:', userMessage);
    // 
    // // Simulate AI response after 1 second
    // setTimeout(() => {
    //   this.chatMessages.push({
    //     // text: `This is a mock response to: "${userMessage}". The actual API endpoint is: ${chatUrl}`,
    //     text: `This is a mock response ...".`,
    //     isUser: false,
    //     timestamp: new Date()
    //   });
    //   this.isSendingMessage = false;
    //   this.cdRef.detectChanges();
    // }, 1000);
    // return; // Exit early, skip real API call
    // ============================================================
    // END TESTING MODE
    // ============================================================

    // ============================================================
    // REAL API CALL - Enabled
    // ============================================================
    this.http.post<{ response: string }>(chatUrl, { message: userMessage }).subscribe({
      next: (response) => {
        this.chatMessages.push({
          text: response.response || 'No response received',
          isUser: false,
          timestamp: new Date()
        });
        this.isSendingMessage = false;
        this.cdRef.detectChanges();
      },
      error: (error) => {
        console.error('Error sending chat message:', error);
        this.chatMessages.push({
          text: 'Sorry, there was an error processing your message. Please try again.',
          isUser: false,
          timestamp: new Date()
        });
        this.isSendingMessage = false;
        this.notificationsService.error(
          this.translateService.instant('display-bitstream.chat.error'),
          error.message || 'Failed to send message'
        );
        this.cdRef.detectChanges();
      }
    });
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
    // Clean up event listener
    if (isPlatformBrowser(this.platformId) && this.sourceNavigationListener) {
      window.removeEventListener('navigateToSource', this.sourceNavigationListener);
    }
    
    // Clean up chat stream subscription
    if (this.chatStreamSubscription) {
      this.chatStreamSubscription.unsubscribe();
    }
  }
  
}
