import {
  AsyncPipe,
  NgClass,
} from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import {
  APP_CONFIG,
  AppConfig,
} from '../../../../../../config/app-config.interface';
import { DSONameService } from '../../../../../core/breadcrumbs/dso-name.service';
import { ViewMode } from '../../../../../core/shared/view-mode.model';
import { ThemedBadgesComponent } from '../../../../../shared/object-collection/shared/badges/themed-badges.component';
import { listableObjectComponent } from '../../../../../shared/object-collection/shared/listable-object/listable-object.decorator';
import { ItemSearchResultListElementComponent } from '../../../../../shared/object-list/search-result-list-element/item-search-result/item-types/item/item-search-result-list-element.component';
import { TruncatableComponent } from '../../../../../shared/truncatable/truncatable.component';
import { TruncatableService } from '../../../../../shared/truncatable/truncatable.service';
import { TruncatablePartComponent } from '../../../../../shared/truncatable/truncatable-part/truncatable-part.component';
import { ThemedThumbnailComponent } from '../../../../../thumbnail/themed-thumbnail.component';
import { ItemDataService } from 'src/app/core/data/item-data.service';
import { BookmarkDataService } from 'src/app/core/data/bookmark-data.service';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { AuthService } from 'src/app/core/auth/auth.service';
import { BitstreamDataService } from 'src/app/core/data/bitstream-data.service';
import { HostWindowService } from 'src/app/shared/host-window.service';
import { FeatureConfigService } from 'src/app/shared/feature-config.service';

@listableObjectComponent('PersonSearchResult', ViewMode.ListElement)
@Component({
  selector: 'ds-person-search-result-list-element',
  styleUrls: ['./person-search-result-list-element.component.scss'],
  templateUrl: './person-search-result-list-element.component.html',
  standalone: true,
  imports: [
    AsyncPipe,
    NgClass,
    RouterLink,
    ThemedBadgesComponent,
    ThemedThumbnailComponent,
    TranslateModule,
    TruncatableComponent,
    TruncatablePartComponent,
  ],
})
/**
 * The component for displaying a list element for an item search result of the type Person
 */
export class PersonSearchResultListElementComponent extends ItemSearchResultListElementComponent implements OnInit {

  public constructor(
    public bitstreamDataService: BitstreamDataService,
    public itemDataService: ItemDataService,
    protected truncatableService: TruncatableService,
    public dsoNameService: DSONameService,
    protected cdRef: ChangeDetectorRef,
    protected bookmarkdataservice: BookmarkDataService,
    public notificationsService: NotificationsService,
    public authService: AuthService,
    public windowService: HostWindowService,
    public featureConfigService: FeatureConfigService,
    @Inject(APP_CONFIG) protected appConfig: AppConfig
  ) {
    super(
      bitstreamDataService,
      itemDataService,
      truncatableService,
      dsoNameService,
      cdRef,
      bookmarkdataservice,
      notificationsService,
      authService,
      windowService,
      featureConfigService,
      appConfig);
  }

  /**
   * Display thumbnail if required by configuration
   */
  showThumbnails: boolean;

  ngOnInit(): void {
    super.ngOnInit();
    this.showThumbnails = this.appConfig.browseBy.showThumbnails;
  }
}
