import {
  AsyncPipe,
  CommonModule,
  NgClass,
  NgTemplateOutlet,
} from '@angular/common';
import {
  Component,
  Input,
  OnInit,
} from '@angular/core';
import {
  RouterLink,
} from '@angular/router';
import {
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { map } from 'rxjs/operators';

import {
  getBitstreamDownloadRoute,
  getBitstreamDownloadWithAccessTokenRoute,
  getBitstreamRequestACopyRoute,
  getBitstreamViewerRoute,
} from '../../app-routing-paths';
import { DSONameService } from '../../core/breadcrumbs/dso-name.service';
import { AuthorizationDataService } from '../../core/data/feature-authorization/authorization-data.service';
import { FeatureID } from '../../core/data/feature-authorization/feature-id';
import { Bitstream } from '../../core/shared/bitstream.model';
import { Item } from '../../core/shared/item.model';
import {
  hasValue,
  isNotEmpty,
} from '../empty.util';
import { ThemedAccessStatusBadgeComponent } from '../object-collection/shared/badges/access-status-badge/themed-access-status-badge.component';
import { DomSanitizer } from '@angular/platform-browser';
import { getFirstSucceededRemoteData, getRemoteDataPayload } from 'src/app/core/shared/operators';
import { of as observableOf, combineLatest as observableCombineLatest, Observable, of } from 'rxjs';
import { ItemRequest } from 'src/app/core/shared/item-request.model';
import { FileSizePipe } from '../utils/file-size-pipe';

@Component({
  selector: 'ds-base-file-download-link',
  templateUrl: './file-download-link.component.html',
  styleUrls: ['./file-download-link.component.scss'],
  standalone: true,
  imports: [
    AsyncPipe,
    NgClass,
    NgTemplateOutlet,
    RouterLink,
    ThemedAccessStatusBadgeComponent,
    TranslateModule,
    FileSizePipe,
    CommonModule
  ],
})
/**
 * Component displaying a download link
 * When the user is authenticated, a short-lived token retrieved from the REST API is added to the download link,
 * ensuring the user is authorized to download the file.
 */
export class FileDownloadLinkComponent implements OnInit {

  /**
   * Optional bitstream instead of href and file name
   */
  @Input() bitstream: Bitstream;

  @Input() item: Item;
  PDFStaticPath: string = "/assets/pdfjs/web/viewer.html?file=";
  /**
   * Additional css classes to apply to link
   */
  @Input() cssClasses = '';

  /**
   * A boolean representing if link is shown in same tab or in a new one.
   */
  @Input() isBlank = false;

    /**
   * A boolean indicating whether the access status badge is displayed
   */
  @Input() showAccessStatusBadge = true;

  /**
   * A boolean indicating whether the download icon should be displayed.
   */
  @Input() showIcon = false;

  itemRequest: ItemRequest;

  @Input() enableRequestACopy = true;

  bitstreamPath$: Observable<{
    routerLink: string,
    queryParams: any,
  }>;

  canDownload$: Observable<boolean>;
  canDownloadWithToken$: Observable<boolean>;
  canRequestACopy$: Observable<boolean>;

  constructor(
    private authorizationService: AuthorizationDataService,
    public sanitizer: DomSanitizer,
    public dsoNameService: DSONameService,
    public translateService: TranslateService,
  ) {
  }

  ngOnInit() {
    if (this.enableRequestACopy) {
      this.canDownload$ = this.authorizationService.isAuthorized(FeatureID.CanDownload, isNotEmpty(this.bitstream) ? this.bitstream.self : undefined);
      this.canDownloadWithToken$ = of((this.itemRequest && this.itemRequest.acceptRequest && !this.itemRequest.accessExpired) ? (this.itemRequest.allfiles !== false || this.itemRequest.bitstreamId === this.bitstream.uuid) : false);
      this.canRequestACopy$ = this.authorizationService.isAuthorized(FeatureID.CanRequestACopy, isNotEmpty(this.bitstream) ? this.bitstream.self : undefined);
      // Set up observable to determine the path to the bitstream based on the user's access rights and features as above
      this.bitstreamPath$ = observableCombineLatest([this.canDownload$, this.canDownloadWithToken$, this.canRequestACopy$]).pipe(
        map(([canDownload, canDownloadWithToken, canRequestACopy]) => this.getBitstreamViewrPath(canDownload, canDownloadWithToken)),
      );     
    } else {
      this.bitstreamPath$ = observableOf(this.getBitstreamDownloadPath()) 
      this.canDownload$ = observableOf(true);
    }
  }

  getBitstreamPath(canDownload: boolean, canRequestACopy: boolean,mimetype:any) {
    if (!canDownload && canRequestACopy && hasValue(this.item)) {
      return getBitstreamRequestACopyRoute(this.item, this.bitstream);
    } else if (mimetype === 'application/pdf') {
      return this.getBitstreamViewrPath(this.item, this.bitstream);
    } else {
      return this.getBitstreamDownloadPath();
    }
       
  }

  getBitstreamDownloadPath() {
    return {
      routerLink: getBitstreamDownloadRoute(this.bitstream),
      queryParams: {}
    };
  }

  getBitstreamViewrPath(canDownload: any, canRequestACopy: any) {
    if (!canDownload && canRequestACopy && hasValue(this.item)) {
      return getBitstreamRequestACopyRoute(this.item, this.bitstream);
    }
      return {
        routerLink: getBitstreamViewerRoute(this.bitstream),
        queryParams: { "itemid": this.item.id }
      };
  }

    getDownloadLinkTitle(canDownload: boolean,canDownloadWithToken: boolean, bitstreamName: string): string {
    return (canDownload || canDownloadWithToken ? this.translateService.instant('file-download-link.download') :
      this.translateService.instant('file-download-link.request-copy')) + bitstreamName;
  }

    /**
   * Resolve special bitstream path which includes access token parameter
   * @param itemRequest the item request object
   */
  getAccessByTokenBitstreamPath(itemRequest: ItemRequest) {
    return getBitstreamDownloadWithAccessTokenRoute(this.bitstream, itemRequest.accessToken);
  }

}
