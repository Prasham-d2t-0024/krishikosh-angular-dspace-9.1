import {
  AsyncPipe,
  KeyValuePipe,
} from '@angular/common';
import {
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';

import { SearchService } from '../../../core/shared/search/search.service';
import { ObjectKeysPipe } from '../../utils/object-keys-pipe';
import { AppliedFilter } from '../models/applied-filter.model';
import { SearchLabelComponent } from './search-label/search-label.component';
import { SearchLabelLoaderComponent } from './search-label-loader/search-label-loader.component';
import { TranslateModule } from '@ngx-translate/core';
import { SearchFilterService } from 'src/app/core/shared/search/search-filter.service';
import { SearchConfigurationService } from 'src/app/core/shared/search/search-configuration.service';
import { currentPath } from '../../utils/route.utils';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'ds-search-labels',
  styleUrls: ['./search-labels.component.scss'],
  templateUrl: './search-labels.component.html',
  standalone: true,
  imports: [
    AsyncPipe,
    KeyValuePipe,
    ObjectKeysPipe,
    SearchLabelComponent,
    SearchLabelLoaderComponent,
    TranslateModule,
    RouterModule
  ],
})

/**
 * Component that represents the labels containing the currently active filters
 */
export class SearchLabelsComponent implements OnInit {

  /**
   * True when the search component should show results on the current page
   */
  @Input() inPlaceSearch: boolean;

  appliedFilters$: BehaviorSubject<AppliedFilter[]>;
  clearParams;
  searchLink: string;
  constructor(
    protected searchService: SearchService,
    protected router: Router,
    protected searchFilterService: SearchFilterService,
    public searchConfigService: SearchConfigurationService
  ) {
  }

  ngOnInit(): void {
    this.appliedFilters$ = this.searchService.appliedFilters$;

    
    this.clearParams = this.searchConfigService.getCurrentFrontendFilters().pipe(map((filters) => {
      Object.keys(filters).forEach((f) => filters[f] = null);
      return filters;
    }));
    this.searchLink = this.getSearchLink();
  }

   minimizeFilters(): void {
    if (this.searchService.appliedFilters$.value.length > 0) {
      this.searchFilterService.minimizeAll();
    }
  }

    /**
   * @returns {string} The base path to the search page, or the current page when inPlaceSearch is true
   */
    private getSearchLink(): string {
      if (this.inPlaceSearch) {
        return currentPath(this.router);
      }
      return this.searchService.getSearchLink();
    }

}
