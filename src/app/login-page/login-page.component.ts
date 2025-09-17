import {
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import {
  combineLatest as observableCombineLatest,
  Subscription,
} from 'rxjs';
import {
  filter,
  take,
} from 'rxjs/operators';

import { AppState } from '../app.reducer';
import {
  AddAuthenticationMessageAction,
  AuthenticatedAction,
  AuthenticationSuccessAction,
  ResetAuthenticationMessagesAction,
} from '../core/auth/auth.actions';
import { AuthTokenInfo } from '../core/auth/models/auth-token-info.model';
import { isAuthenticated } from '../core/auth/selectors';
import {
  hasValue,
  isNotEmpty,
} from '../shared/empty.util';
import { ThemedLogInComponent } from '../shared/log-in/themed-log-in.component';
import { AppImageConfigService } from '../shared/app-image-config.service';
import { FeatureConfigService } from '../shared/feature-config.service';

/**
 * This component represents the login page
 */
@Component({
  selector: 'ds-base-login-page',
  styleUrls: ['./login-page.component.scss'],
  templateUrl: './login-page.component.html',
  standalone: true,
  imports: [
    ThemedLogInComponent,
    TranslateModule,
  ],
})
export class LoginPageComponent implements OnDestroy, OnInit {

  /**
   * Subscription to unsubscribe onDestroy
   * @type {Subscription}
   */
  sub: Subscription;
  logoPath: string;
  showRepositoryLogo: boolean = true;
  /**
   * Initialize instance variables
   *
   * @param {ActivatedRoute} route
   * @param {Store<AppState>} store
   */
  constructor(private route: ActivatedRoute,
              private store: Store<AppState>,
              private imageservice: AppImageConfigService,
              private featureConfigService:FeatureConfigService
            ) {
              this.imageservice.load();
              this.featureConfigService.load();
            }

  /**
   * Initialize instance variables
   */
  ngOnInit() {
    const queryParamsObs = this.route.queryParams;
    this.logoPath = this.imageservice.login;
    this.showRepositoryLogo = this.featureConfigService?.showRepositoryLogo;
    let repositoryLogo = document.getElementById("repository-logo") as HTMLElement;
    repositoryLogo.style.width = this.imageservice?.imageSizes?.login?.width;
    repositoryLogo.style.height = this.imageservice?.imageSizes?.login?.height;
    const authenticated = this.store.select(isAuthenticated);
    this.sub = observableCombineLatest(queryParamsObs, authenticated).pipe(
      filter(([params, auth]) => isNotEmpty(params.token) || isNotEmpty(params.expired)),
      take(1),
    ).subscribe(([params, auth]) => {
      const token = params.token;
      let authToken: AuthTokenInfo;
      if (!auth) {
        if (isNotEmpty(token)) {
          authToken = new AuthTokenInfo(token);
          this.store.dispatch(new AuthenticatedAction(authToken));
        } else if (isNotEmpty(params.expired)) {
          this.store.dispatch(new AddAuthenticationMessageAction('auth.messages.expired'));
        }
      } else {
        if (isNotEmpty(token)) {
          authToken = new AuthTokenInfo(token);
          this.store.dispatch(new AuthenticationSuccessAction(authToken));
        }
      }
    });
  }

  /**
   * Unsubscribe from subscription
   */
  ngOnDestroy() {
    if (hasValue(this.sub)) {
      this.sub.unsubscribe();
    }
    // Clear all authentication messages when leaving login page
    this.store.dispatch(new ResetAuthenticationMessagesAction());
  }
}
