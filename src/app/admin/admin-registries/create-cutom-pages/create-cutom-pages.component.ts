import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularEditorConfig, AngularEditorModule } from '@kolkov/angular-editor';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ChartService } from 'src/app/core/shared/trending-charts/chart.service';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';

@Component({
  selector: 'ds-create-cutom-pages',
  standalone: true,
  imports: [
    NgbModule,
    FormsModule,
    AngularEditorModule,
    TranslateModule,
    ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './create-cutom-pages.component.html',
  styleUrl: './create-cutom-pages.component.scss'
})
export class CreateCutomPagesComponent implements OnInit {
  typedValue: string;
  id: string;
  editorConfig: AngularEditorConfig = {
    editable: true,
    spellcheck: true,
    height: 'auto',
    minHeight: '250px',
    maxHeight: 'auto',
    width: 'auto',
    minWidth: '0',
    translate: 'yes',
    enableToolbar: true,
    showToolbar: true,
    placeholder: 'Enter text here...',
    defaultParagraphSeparator: '',
    defaultFontName: '',
    defaultFontSize: '',
    sanitize: false,
    toolbarHiddenButtons: [
      ['insertImage']  // hides the image upload/insert button
    ],
    fonts: [
      { class: 'arial', name: 'Arial' },
      { class: 'times-new-roman', name: 'Times New Roman' },
      { class: 'calibri', name: 'Calibri' },
      { class: 'comic-sans-ms', name: 'Comic Sans MS' }
    ],
    customClasses: [
      {
        name: 'quote',
        class: 'quote',
      },
      {
        name: 'redText',
        class: 'redText'
      },
      {
        name: 'titleText',
        class: 'titleText',
        tag: 'h1',
      },
    ],
    uploadUrl: 'v1/image'
  };
  masterNames: any;
  showUser: boolean = false;
  pagename: FormControl = new FormControl();
  pagesData: any = [];
  loading:boolean = false;
  loading1:boolean = false;
  pageType: FormControl = new FormControl();
  isAdd:boolean = true;
  pagetext: FormControl = new FormControl();
  constructor(
    private notificationsService: NotificationsService,
    private cdref: ChangeDetectorRef,
    private chartService: ChartService,
    protected modalService: NgbModal,
    private translate: TranslateService) {

  }
  ngOnInit() {
    this.getPagesData();
  }
  
  saveTypedValue(value: string) {
    this.typedValue = value;
  }

  submit() {
    // if (!!this.id) {
    //   this.aboutusDataService.updateAboutus(this.typedValue, this.id).pipe().subscribe((data) => {
    //     if (data.state === "Success") {
    //       // this.typedValue = "";
    //       this.typedValue = data.payload.texteditor
    //       this.notificationsService.success('About Us Updated successfully!');
    //     }
    //   });
    // } else {
    //   this.aboutusDataService.submit(this.typedValue).pipe().subscribe((data) => {
    //     if (data.state === "Success") {
    //       // this.typedValue = "";
    //       // console.log(data);
    //       this.id = data.payload.id
    //       this.typedValue = data.payload.texteditor
    //       this.notificationsService.success('About Us added successfully!');
    //     }
    //   });
    // }
  }

  searchUser() {

  }

  selectMaster(item: any) {

  }

  addPage() {
    if (this.pagename.value === "" || !this.pagename.value || this.pagename.value === null) {
      this.notificationsService.error(this.translate.get('about.notification.invalid'), { name: "" });
      return;
    }
    this.loading = true;
    const postData = {
      mastername: this.pagename.value
    }

    this.chartService.addDynamicPage(postData).pipe().subscribe((data) => {
      this.loading = false;
      if(data) {
        this.pagename.patchValue('');
        this.getPagesData();
      }
    });
  }

  getPagesData() {
    this.chartService.getDynamicPages().pipe().subscribe((data) => {
      if (data?.['_embedded']?.['pagemasters']) {
        this.pagesData = data['_embedded']['pagemasters'];
        console.log(this.pagesData);
        this.cdref.detectChanges();
      } else {
      this.pagesData = [];
      this.cdref.detectChanges();
      }
    });
  }

  mastervaluedata(item, index) {

  }

  viewMasterValue(item: any, event: any) {
    this.pagetext.patchValue(item['mastername']);
    this.chartService.getDynamicPageContent(item['mastername']).pipe().subscribe((data) => {
      if (data?.['_embedded']) {
        this.isAdd = false;
        this.typedValue = data['_embedded']['pagedetails'][0]['texteditor'];
        this.id = data['_embedded']['pagedetails'][0]['uuid'];
        this.cdref.detectChanges();
      } else {
        this.isAdd = true;
        this.typedValue = "";
        this.cdref.detectChanges();
      }
    });
  }
  
  updatePage(item: any) {
    this.loading1 = true;
    if (this.pagetext.value === "" || this.typedValue === "") {
      this.loading1 = false;
      this.notificationsService.error(this.translate.get('about.notification.invalid'), { name: "" });
      return;
    }
    const pageData = {
      mastername: this.pagetext.value
    }
    this.chartService.editPageName(pageData,item['uuid']).pipe().subscribe((data) => {
      if(data.state === "Success") {
      } else {
        this.notificationsService.error(this.translate.get('about.notification.notadd'), { name: "" });
      }
    });
    const postData = {
      texteditor: this.typedValue,
      status: "Active",
      pagemasterRest: {
        uuid: item['uuid'],
      },
      question: "",
      answers: ""
    }
    this.chartService.updatePageContent(postData, this.id).pipe().subscribe((data) => {
      this.loading1 = false;
      this.cdref.detectChanges();
      if(data.state === "Success") {
        this.notificationsService.success(this.translate.get('about.notification.updated'), { name: "" });
        this.getPagesData();
      } else {
        this.notificationsService.error(this.translate.get('about.notification.notupdated'), { name: "" });
      }
    });
  }

  addPageContent(item) {
    this.loading1 = true;
    if (this.pagetext.value === "" || this.typedValue === "") {
      this.loading1 = false;
      this.notificationsService.error(this.translate.get('about.notification.invalid'), { name: "" });
      return;
    }
    const pageData = {
      mastername: this.pagetext.value
    }
    this.chartService.editPageName(pageData,item['uuid']).pipe().subscribe((data) => {
      if(data.state === "Success") {
      } else {
        this.notificationsService.error(this.translate.get('about.notification.notadd'), { name: "" });
      }
    });
    const postData = {
      texteditor: this.typedValue,
      status: "Active",
      pagemasterRest: {
        uuid: item['uuid'],
      },
      question: "",
      answers: ""
    }
    this.chartService.addPageContent(postData).pipe().subscribe((data) => {
      this.loading1 = false;
      this.cdref.detectChanges();
      if(data.state === "Success") {
        // this.notificationsService.success('Page content updated successfully!');
        this.notificationsService.success(this.translate.get('about.notification.add'), { name: "" });
        this.getPagesData();
      } else {
        // this.notificationsService.error('Page content not updated successfully!');
        this.notificationsService.error(this.translate.get('about.notification.notadd'), { name: "" });
      }
    });
  }

  deletePage(content,item) {
    this.modalService.open(content).result.then(
      (result) => {
        if (result === 'ok') {
          this.loading1 = true;
          this.chartService.deleteDynamicPage(item['uuid']).pipe().subscribe((data) => {
            this.loading1 = false;
            this.notificationsService.success(this.translate.get('about.notification.pagedeleted'), { name: "" });
            this.getPagesData();
          });
        } else {
          this.loading1 = false;
        }
      });
  }
}
