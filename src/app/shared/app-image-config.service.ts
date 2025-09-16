import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })

export class AppImageConfigService {
  private imageConfig: any = {};
  private imageSizeConfig: any = {};
  private homePageLayout: any = {};

  constructor(private http: HttpClient) {}

  load(): Promise<any> {
    return this.http.get<any>('assets/image-config.json')
      .toPromise()
      .then(config => {
        this.imageConfig = config.images || {};
        this.imageSizeConfig = config.imageSizes || {};
        this.homePageLayout = config.homePageLayoutConfig || {};
      });
  }

  get logo(): string {
    return this.imageConfig.logo;
  }
  get favicon(): string {
    return this.imageConfig.favicon;
  }
  get homepage(): string {
    return this.imageConfig.homepage || '';
  }
  get login(): string {
    return this.imageConfig.login || '';
  }
  get imageSizes(): any {
    return this.imageSizeConfig || {};
  }
  get homePageLayoutConfig(): any {
    return this.homePageLayout || {};
  }
} 