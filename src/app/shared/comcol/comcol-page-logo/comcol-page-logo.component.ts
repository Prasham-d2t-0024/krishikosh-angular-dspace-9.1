
import {
  Component,
  Input,
} from '@angular/core';

import { Bitstream } from '../../../core/shared/bitstream.model';
import { defaultCommunityImage } from 'src/app/app-config';

@Component({
  selector: 'ds-comcol-page-logo',
  styleUrls: ['./comcol-page-logo.component.scss'],
  templateUrl: './comcol-page-logo.component.html',
  imports: [],
  standalone: true,
})
export class ComcolPageLogoComponent {
  @Input() logo: Bitstream;

  @Input() alternateText: string;

  /**
   * The default 'holder.js' image
   */
  holderSource = defaultCommunityImage['defaultthumbnailForCommunity'];

  errorHandler(event) {
    event.currentTarget.src = this.holderSource;
  }

}
