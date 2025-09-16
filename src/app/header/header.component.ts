import { AsyncPipe } from '@angular/common';
import {
  Component,
  OnInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';

import { ThemedSearchNavbarComponent } from '../search-navbar/themed-search-navbar.component';
import { ThemedAuthNavMenuComponent } from '../shared/auth-nav-menu/themed-auth-nav-menu.component';
import {
  HostWindowService,
  WidthCategory,
} from '../shared/host-window.service';
import { ImpersonateNavbarComponent } from '../shared/impersonate-navbar/impersonate-navbar.component';
import { ThemedLangSwitchComponent } from '../shared/lang-switch/themed-lang-switch.component';
import { MenuService } from '../shared/menu/menu.service';
import { MenuID } from '../shared/menu/menu-id.model';
import { ContextHelpToggleComponent } from './context-help-toggle/context-help-toggle.component';
import { AppImageConfigService } from '../shared/app-image-config.service';

/**
 * Represents the header with the logo and simple navigation
 */
@Component({
  selector: 'ds-base-header',
  styleUrls: ['header.component.scss'],
  templateUrl: 'header.component.html',
  standalone: true,
  imports: [
    AsyncPipe,
    ContextHelpToggleComponent,
    ImpersonateNavbarComponent,
    NgbDropdownModule,
    RouterLink,
    ThemedAuthNavMenuComponent,
    ThemedLangSwitchComponent,
    ThemedSearchNavbarComponent,
    TranslateModule,
  ],
})
export class HeaderComponent implements OnInit {
  /**
   * Whether user is authenticated.
   * @type {Observable<string>}
   */
  public isAuthenticated: Observable<boolean>;
  public isMobile$: Observable<boolean>;
  public isXsOrSm$: Observable<boolean>;
  public logoPath: string;
  menuID = MenuID.PUBLIC;
  maxMobileWidth = WidthCategory.SM;
  logoDimension:any = {width:'120px', height:'75px'}

  constructor(
    protected menuService: MenuService,
    protected windowService: HostWindowService,
    private imageConfig: AppImageConfigService
  ) {
      this.imageConfig.load();
  }

  ngOnInit(): void {
    this.isMobile$ = this.windowService.isUpTo(this.maxMobileWidth);
    this.isXsOrSm$ = this.windowService.isXsOrSm();
    this.logoPath = this.imageConfig.logo;
    this.logoDimension.height = this.imageConfig?.imageSizes?.logo?.height;
    this.logoDimension.width = this.imageConfig?.imageSizes?.logo?.width;
  }

  public toggleNavbar(): void {
    this.menuService.toggleMenu(this.menuID);
  }
}
