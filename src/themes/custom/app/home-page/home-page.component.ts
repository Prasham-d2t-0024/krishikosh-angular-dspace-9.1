import {
  AsyncPipe,
  CommonModule,
  NgTemplateOutlet,
} from '@angular/common';
import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { HomeCoarComponent } from '../../../../app/home-page/home-coar/home-coar.component';
import { ThemedHomeNewsComponent } from '../../../../app/home-page/home-news/themed-home-news.component';
import { HomePageComponent as BaseComponent } from '../../../../app/home-page/home-page.component';
import { RecentItemListComponent } from '../../../../app/home-page/recent-item-list/recent-item-list.component';
import { ThemedTopLevelCommunityListComponent } from '../../../../app/home-page/top-level-community-list/themed-top-level-community-list.component';
import { SuggestionsPopupComponent } from '../../../../app/notifications/suggestions/popup/suggestions-popup.component';
import { ThemedConfigurationSearchPageComponent } from '../../../../app/search-page/themed-configuration-search-page.component';
import { ThemedSearchFormComponent } from '../../../../app/shared/search-form/themed-search-form.component';
import { SearchFormComponent } from 'src/app/shared/search-form/search-form.component';
import { NgbCarouselModule, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { HomeTrendingItemComponent } from 'src/app/home-page/home-trending-item/home-trending-item.component';
import { HomeTrandingGeolocationComponent } from 'src/app/home-page/home-tranding-geolocation/home-tranding-geolocation.component';
import { HomeTrandingSearchesComponent } from 'src/app/home-page/home-tranding-searches/home-tranding-searches.component';
import { HomeTrandingTypesComponent } from 'src/app/home-page/home-tranding-types/home-tranding-types.component';
import { HomeTrandingCommunitiesComponent } from 'src/app/home-page/home-tranding-communities/home-tranding-communities.component';

@Component({
  selector: 'ds-themed-home-page',
  // styleUrls: ['./home-page.component.scss'],
  styleUrls: ['../../../../app/home-page/home-page.component.scss'],
  // templateUrl: './home-page.component.html'
  templateUrl: '../../../../app/home-page/home-page.component.html',
  standalone: true,
  imports: [
    AsyncPipe,
    HomeCoarComponent,
    NgTemplateOutlet,
    RecentItemListComponent,
    SuggestionsPopupComponent,
    ThemedConfigurationSearchPageComponent,
    ThemedHomeNewsComponent,
    ThemedSearchFormComponent,
    ThemedTopLevelCommunityListComponent,
    TranslateModule,
    SearchFormComponent,
    NgbNavModule,
    CommonModule,
    NgbCarouselModule,
    HomeTrendingItemComponent,
    HomeTrandingGeolocationComponent,
    HomeTrendingItemComponent,
    HomeTrandingSearchesComponent,
    HomeTrandingTypesComponent,
    HomeTrandingCommunitiesComponent
  ],
})
export class HomePageComponent extends BaseComponent {
}
