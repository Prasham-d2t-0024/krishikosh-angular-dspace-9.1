import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type featureConfigModel = {
  allowCommenting:boolean,
  allowRating:boolean,
  showRepositoryLogo:boolean,
}
@Injectable({ providedIn: 'root' })


export class FeatureConfigService {
  private featureConfig: featureConfigModel;
  constructor(private http: HttpClient) {}

  load(): Promise<any> {
    return this.http.get<any>('assets/theme-config.json')
      .toPromise()
      .then(config => {
        this.featureConfig = config.feature_config || {allowCommenting:true, allowRating:true};
      });
  }

  get allowRating(): boolean {
    return this.featureConfig.allowRating;
  }
  get allowCommenting(): boolean {
    return this.featureConfig.allowCommenting;
  }
  get showRepositoryLogo(): boolean {
    return this.featureConfig.showRepositoryLogo;
  }
} 