import { Component } from '@angular/core';

import { ThemedComponent } from '../shared/theme-support/themed.component';
import { CommunityPageComponent } from './community-page.component';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';

/**
 * Themed wrapper for CommunityPageComponent
 */
@Component({
  selector: 'ds-community-page',
  styleUrls: [],
  templateUrl: '../shared/theme-support/themed.component.html',
  standalone: true,
  imports: [
    CommunityPageComponent,
    NgbNavModule
  ],
})
export class ThemedCommunityPageComponent extends ThemedComponent<CommunityPageComponent> {
  protected getComponentName(): string {
    return 'CommunityPageComponent';
  }

  protected importThemedComponent(themeName: string): Promise<any> {
    return import(`../../themes/${themeName}/app/community-page/community-page.component`);
  }

  protected importUnthemedComponent(): Promise<any> {
    return import(`./community-page.component`);
  }

}
