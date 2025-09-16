import { AsyncPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  ViewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { Item } from '../../../../core/shared/item.model';
import { ViewMode } from '../../../../core/shared/view-mode.model';
import { DsoEditMenuComponent } from '../../../../shared/dso-page/dso-edit-menu/dso-edit-menu.component';
import { MetadataFieldWrapperComponent } from '../../../../shared/metadata-field-wrapper/metadata-field-wrapper.component';
import { listableObjectComponent } from '../../../../shared/object-collection/shared/listable-object/listable-object.decorator';
import { ThemedResultsBackButtonComponent } from '../../../../shared/results-back-button/themed-results-back-button.component';
import { ThemedThumbnailComponent } from '../../../../thumbnail/themed-thumbnail.component';
import { CollectionsComponent } from '../../../field-components/collections/collections.component';
import { ThemedMediaViewerComponent } from '../../../media-viewer/themed-media-viewer.component';
import { MiradorViewerComponent } from '../../../mirador-viewer/mirador-viewer.component';
import { ThemedFileSectionComponent } from '../../field-components/file-section/themed-file-section.component';
import { ItemPageAbstractFieldComponent } from '../../field-components/specific-field/abstract/item-page-abstract-field.component';
import { ItemPageCcLicenseFieldComponent } from '../../field-components/specific-field/cc-license/item-page-cc-license-field.component';
import { ItemPageDateFieldComponent } from '../../field-components/specific-field/date/item-page-date-field.component';
import { GenericItemPageFieldComponent } from '../../field-components/specific-field/generic/generic-item-page-field.component';
import { GeospatialItemPageFieldComponent } from '../../field-components/specific-field/geospatial/geospatial-item-page-field.component';
import { ThemedItemPageTitleFieldComponent } from '../../field-components/specific-field/title/themed-item-page-field.component';
import { ItemPageUriFieldComponent } from '../../field-components/specific-field/uri/item-page-uri-field.component';
import { ThemedMetadataRepresentationListComponent } from '../../metadata-representation-list/themed-metadata-representation-list.component';
import { ItemComponent } from '../shared/item.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { PaginationComponent } from 'src/app/shared/pagination/pagination.component';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { DisplayMapComponent } from 'src/app/shared/display-map/display-map.component';
import { ItemPageTitleFieldComponent } from '../../field-components/specific-field/title/item-page-title-field.component';
import { TruncatablePartComponent } from 'src/app/shared/truncatable/truncatable-part/truncatable-part.component';
import { TruncatableComponent } from 'src/app/shared/truncatable/truncatable.component';

/**
 * Component that represents a publication Item page
 */

@listableObjectComponent(Item, ViewMode.StandalonePage)
@Component({
  selector: 'ds-untyped-item',
  styleUrls: ['./untyped-item.component.scss'],
  templateUrl: './untyped-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    AsyncPipe,
    CollectionsComponent,
    DsoEditMenuComponent,
    GenericItemPageFieldComponent,
    GeospatialItemPageFieldComponent,
    ItemPageAbstractFieldComponent,
    ItemPageCcLicenseFieldComponent,
    ItemPageDateFieldComponent,
    ItemPageUriFieldComponent,
    MetadataFieldWrapperComponent,
    MiradorViewerComponent,
    RouterLink,
    ThemedFileSectionComponent,
    ThemedItemPageTitleFieldComponent,
    ThemedMediaViewerComponent,
    ThemedMetadataRepresentationListComponent,
    ThemedResultsBackButtonComponent,
    ThemedThumbnailComponent,
    TranslateModule,
    NgbModule,
    DatePipe,
    PaginationComponent,
    ReactiveFormsModule,
    NgxChartsModule,
    DisplayMapComponent,
    TruncatablePartComponent,
    TruncatableComponent,
  ],
})
export class UntypedItemComponent extends ItemComponent {
  @Input() isBlank: Boolean = true;
  lineChartdata:any;
  type:string;
  isLoading: false;
  showXAxis: boolean = true;
  showYAxis: boolean = true;
  gradient: boolean = false;
  showLegend: boolean = true;
  showLegendLabel: boolean = true;
  legendPosition: string = 'below';
  showXAxisLabel: boolean = false;
  yAxisLabel: string = 'Country';
  xAxisLabel: string = 'Counts';
  showYAxisLabel: boolean = false;
  timeline: boolean = true;
  xAxis: boolean = true;
  yAxis: boolean = true;
  legend: boolean = true;

  @ViewChild('commentsSection') commentsSection!: ElementRef;

  scrollToComments() {
    if (this.commentsSection) {
      this.commentsSection.nativeElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }
}
