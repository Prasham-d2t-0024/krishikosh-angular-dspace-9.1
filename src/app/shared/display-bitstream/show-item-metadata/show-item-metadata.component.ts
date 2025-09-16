import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { tr } from 'date-fns/locale';
import { Item } from 'src/app/core/shared/item.model';
import { TruncatableComponent } from '../../truncatable/truncatable.component';
import { TruncatablePartComponent } from '../../truncatable/truncatable-part/truncatable-part.component';
import { PdfJsViewerModule } from 'ng2-pdfjs-viewer';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'ds-show-item-metadata',
  templateUrl: './show-item-metadata.component.html',
  styleUrls: ['./show-item-metadata.component.scss'],
  standalone:true,
  imports:[
    CommonModule,
    RouterModule,
    TranslatePipe,
    TruncatablePartComponent,
    TruncatableComponent,
    PdfJsViewerModule,
    NgbNavModule
  ]
})
export class ShowItemMetadataComponent {
@Input() itemTab :Item;
}
