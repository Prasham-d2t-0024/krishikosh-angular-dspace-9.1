import {
  AsyncPipe,
  CommonModule,
  isPlatformBrowser,
  JsonPipe,
  NgClass,
} from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { Item } from '../../../../../../core/shared/item.model';
import { ViewMode } from '../../../../../../core/shared/view-mode.model';
import { getItemPageRoute } from '../../../../../../item-page/item-page-routing-paths';
import { ThemedThumbnailComponent } from '../../../../../../thumbnail/themed-thumbnail.component';
import { ThemedBadgesComponent } from '../../../../../object-collection/shared/badges/themed-badges.component';
import { ItemSearchResult } from '../../../../../object-collection/shared/item-search-result.model';
import { listableObjectComponent } from '../../../../../object-collection/shared/listable-object/listable-object.decorator';
import { TruncatableComponent } from '../../../../../truncatable/truncatable.component';
import { TruncatablePartComponent } from '../../../../../truncatable/truncatable-part/truncatable-part.component';
import { SearchResultListElementComponent } from '../../../search-result-list-element.component';
import { TranslateModule } from '@ngx-translate/core';
import { ItemDataService } from 'src/app/core/data/item-data.service';
import { APP_CONFIG, AppConfig } from 'src/config/app-config.interface';
import { DSONameService } from 'src/app/core/breadcrumbs/dso-name.service';
import { TruncatableService } from 'src/app/shared/truncatable/truncatable.service';
import { BookmarkDataService } from 'src/app/core/data/bookmark-data.service';
import { getFirstCompletedRemoteData } from 'src/app/core/shared/operators';
import { RemoteData } from 'src/app/core/data/remote-data';
import { Bookmark } from 'src/app/core/shared/bookmark.model';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { first, Observable, of, take } from 'rxjs';
import { NgbDropdownModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { FeatureID } from 'src/app/core/data/feature-authorization/feature-id';
import { AuthorizationDataService } from 'src/app/core/data/feature-authorization/authorization-data.service';
import { AuthService } from 'src/app/core/auth/auth.service';
import { Bitstream } from 'src/app/core/shared/bitstream.model';
import { BitstreamDataService } from 'src/app/core/data/bitstream-data.service';
import { hasValue } from 'src/app/shared/empty.util';
import { followLink } from 'src/app/shared/utils/follow-link-config.model';
import { PaginatedList } from 'src/app/core/data/paginated-list.model';
import { HostWindowService } from 'src/app/shared/host-window.service';
import { FeatureConfigService } from 'src/app/shared/feature-config.service';

@listableObjectComponent('PublicationSearchResult', ViewMode.ListElement)
@listableObjectComponent(ItemSearchResult, ViewMode.ListElement)
@Component({
  selector: 'ds-item-search-result-list-element',
  styleUrls: ['./item-search-result-list-element.component.scss'],
  templateUrl: './item-search-result-list-element.component.html',
  standalone: true,
  imports: [
    AsyncPipe,
    NgClass,
    RouterLink,
    ThemedBadgesComponent,
    ThemedThumbnailComponent,
    TruncatableComponent,
    TruncatablePartComponent,
    TranslateModule,
    NgbModule,
    FormsModule,
    JsonPipe,
    CommonModule,
    NgbDropdownModule
  ],
  providers: [
    BookmarkDataService,
    ItemDataService
  ]
})
/**
 * The component for displaying a list element for an item search result of the type Publication
 */
export class ItemSearchResultListElementComponent extends SearchResultListElementComponent<ItemSearchResult, Item> implements OnInit {
  /**
   * Route to the item's page
   */
  itemPageRoute: string;
  cirtation = [];
  bookmarkitem: any;
  isAuthorized$: Observable<boolean> = of(false);
  cirteanselection = 'APA';
  bitstreamLength: number;
  objbistem: Bitstream;
  isMobileView:boolean = false;
  allowCommenting:boolean = false;
  allowRating:boolean = false;

  constructor(
    protected bitstreamDataService: BitstreamDataService,
    public itemDataService: ItemDataService,
    protected truncatableService: TruncatableService,
    public dsoNameService: DSONameService,
    protected cdRef: ChangeDetectorRef,
    protected bookmarkdataservice: BookmarkDataService,
    public notificationsService: NotificationsService,
    public authService: AuthService,
    public windowService: HostWindowService,
    public featureConfigService: FeatureConfigService,
    @Inject(PLATFORM_ID) private platformId: any,
    @Inject(APP_CONFIG) protected appConfig?: AppConfig,

  ) {
    super(truncatableService, dsoNameService, appConfig);
    if (isPlatformBrowser(this.platformId)) {
      this.windowService.isXsOrSm().pipe(
        first()
      ).subscribe((isMobile) => {
        this.isMobileView = isMobile;
      });
    }
    this.featureConfigService.load();
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.isAuthorized$ = this.authService.isAuthenticated();
    this.showThumbnails = this.showThumbnails ?? this.appConfig.browseBy.showThumbnails;
    this.itemPageRoute = getItemPageRoute(this.dso);
    this.allowCommenting = this.featureConfigService.allowCommenting;
    this.allowRating = this.featureConfigService.allowRating;
  }
  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.findBookMark();
      this.getpdf();
    }
  }

  findBookMark() {
    this.isAuthorized$.pipe(take(1)).subscribe((isautho: Boolean) => {
      if (isautho) {
        this.bookmarkdataservice.findBookmarkByuserofItem(this.object.indexableObject.id).pipe(getFirstCompletedRemoteData()).subscribe((rd) => {
          if (rd.hasSucceeded) {
            this.bookmarkitem = rd.payload;
          }
        })

      }
    })

  }

  savebookmark() {
    if (this.bookmarkitem != undefined && this.bookmarkitem.id) {
      let newStatus = (this.bookmarkitem.status === 'active') ? 'dactive' : 'active';
      let payload = {
        ...this.bookmarkitem,
        status: newStatus,
        itemRest: { uuid: this.bookmarkitem.itemRest?.uuid },
        submitterRest: { uuid: this.bookmarkitem.submitterRest?.uuid }
      };
      this.bookmarkdataservice.put(payload).pipe(
        getFirstCompletedRemoteData()
      ).subscribe((rd: RemoteData<Bookmark>) => {
        if (rd.hasSucceeded) {
          this.bookmarkitem = rd.payload;
          this.cdRef.detectChanges();
          if (this.bookmarkitem.status === 'active') {
            this.notificationsService.success('Bookmark this item  successfully!');
          } else {
            this.notificationsService.success('UnBookmark this item  successfully!');
          }

        } else {
          this.notificationsService.error('An error occurred while Bookmarking this item! ');
        }
      })
    } else {
      let data = {
        "itemRest": {
          "uuid": this.object.indexableObject.uuid
        }
      };
      const bookmarkToCreate = Object.assign(new Bookmark(), data);
      this.bookmarkdataservice.create(bookmarkToCreate).pipe(
        getFirstCompletedRemoteData()
      ).subscribe((rd: RemoteData<Bookmark>) => {

        if (rd.hasSucceeded) {
          this.bookmarkitem = rd.payload;
          //this.CommentFormGroup.reset();
          //this.getCommentList();
          this.cdRef.detectChanges();
          this.notificationsService.success('Bookmark this item  successfully!');
        } else {
          this.notificationsService.error('An error occurred while Bookmarking this item! ');
        }
      })
    }
  }

  dowloadFile() {
    let URL = this.itemDataService.downloadCitetion(this.object.indexableObject.id, this.cirteanselection);
    const link = document.createElement('a');
    link.href = URL;
    link.download = URL;
    link.click()
  }

  copyInputMessage(inputElement: HTMLDivElement) {
    const range = document.createRange();
    range.selectNode(inputElement);

    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);

      document.execCommand('copy');

      // Clear the selection to prevent visual disruption
      selection.removeAllRanges();
    }
  }

  isModalOpen: boolean = false;
  openModal() {
    this.itemDataService.getCitetion(this.object.indexableObject.id).pipe().subscribe((data) => {
      if (!!data && data.statusCode === 200 && !!data.payload) {
        this.cirtation = Object.entries(data.payload);
        this.isModalOpen = true;
        this.cdRef.detectChanges();
      }
    });
  }

  closeModal() {
    this.isModalOpen = false;
  }

  getpdf() {
    this.bitstreamDataService.findAllByItemAndBundleName(this.object.indexableObject, 'ORIGINAL', {
      currentPage: 1,
      elementsPerPage: 2
    }, true, true, followLink('format')).pipe(
      getFirstCompletedRemoteData(),
    ).subscribe((bitstreamsRD: RemoteData<PaginatedList<Bitstream>>) => {
      if (bitstreamsRD.errorMessage) {

      } else if (hasValue(bitstreamsRD.payload)) {
        this.bitstreamLength = bitstreamsRD.payload.page.length;
        if (bitstreamsRD.payload.page.length > 0) {
          this.objbistem = bitstreamsRD.payload.page[0];
        }
      }
    });

  }
  openpdf() {
    window.open("/bitstreams/" + this.objbistem.id + "/viewer?itemid=" + this.object.indexableObject.id)

  }

}
