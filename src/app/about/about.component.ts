import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { ChartService } from '../core/shared/trending-charts/chart.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ds-about',
  standalone: true,
  imports: [],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent implements OnInit {
  html: string;
  pageKeyword: string;
  pageTitle: string = "";
  constructor(private sanitizer: DomSanitizer,
    private cdref: ChangeDetectorRef,
    private route: ActivatedRoute,
    protected chartService: ChartService,
    private translateService: TranslateService) {  }

  ngOnInit() {
    this.pageTitle = "";
    this.route.paramMap.subscribe(params => {
      this.pageKeyword = decodeURIComponent(params.get('aboutus-type') || '');
      this.chartService.getDynamicPageContent(this.pageKeyword).pipe().subscribe((data) => {
        if (data?.['_embedded']) {
          this.html = data['_embedded']['pagedetails'][0]['texteditor'];
          this.pageTitle = data?.['_embedded']?.['pagedetails']?.[0]?.['pagemasterRest']?.['mastername'];
          let prefix = this.translateService.instant('repository.title.prefix');
          document.title = `${prefix}${this.pageTitle}`
          this.cdref.detectChanges();
        } else {
          this.html = '';
          this.cdref.detectChanges();
        }
      });  // Outputs 'FAQ' or 'About Us'
    });
  }

  getSanitizedHtml() {
    return this.sanitizer.bypassSecurityTrustHtml(this.html);
  }
}
