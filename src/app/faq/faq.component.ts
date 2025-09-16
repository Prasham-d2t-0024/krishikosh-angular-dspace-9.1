import { ChangeDetectorRef, Component } from '@angular/core';
import { FaqDataService } from '../core/data/faq-data.service';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'ds-faq',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss'
})
export class FaqComponent {
  faq: any;
  constructor(private faqDataService: FaqDataService,
    private sanitizer: DomSanitizer,
    private cdRef: ChangeDetectorRef) {
    this.faqDataService.getFAQs().pipe().subscribe((data) => {
      if (!!data['_embedded']) {
        this.faq = data['_embedded'].faqs;
        this.cdRef.detectChanges();
      }
    });
  }

  getSanitizedHtml(value: string) {
    return this.sanitizer.bypassSecurityTrustHtml(value);
  }
}
