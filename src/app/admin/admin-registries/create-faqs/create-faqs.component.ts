import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AngularEditorConfig, AngularEditorModule } from '@kolkov/angular-editor';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, map, Observable, switchMap } from 'rxjs';
import { FaqDataService } from 'src/app/core/data/faq-data.service';
import { FindListOptions } from 'src/app/core/data/find-list-options.model';
import { PaginatedList } from 'src/app/core/data/paginated-list.model';
import { RemoteData } from 'src/app/core/data/remote-data';
import { PaginationService } from 'src/app/core/pagination/pagination.service';
import { Faqs } from 'src/app/core/shared/faqs.model';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { PaginationComponentOptions } from 'src/app/shared/pagination/pagination-component-options.model';
import { PaginationComponent } from 'src/app/shared/pagination/pagination.component';

@Component({
  selector: 'ds-create-faqs',
  standalone: true,
  imports: [
    NgbModule,
    FormsModule,
    AngularEditorModule,
    TranslateModule,
    ReactiveFormsModule,
    CommonModule,
    DragDropModule,
    PaginationComponent,
  ],
  templateUrl: './create-faqs.component.html',
  styleUrl: './create-faqs.component.scss'
})
export class CreateFAQsComponent implements OnInit {
  question: any;
  answer: any;
  faq:  BehaviorSubject<Faqs> = new BehaviorSubject<Faqs>(undefined);
  isEdit: boolean = false;
  itemId:string;
  existQuestionValue = new FormControl();
  existAnswerValue = new FormControl();
  isEditRunning: boolean = false;
  url: string;
  pageConfig: PaginationComponentOptions = Object.assign(new PaginationComponentOptions(), {
    id: 'faq',
    pageSize: 100
  });
  config: FindListOptions = Object.assign(new FindListOptions(), {
    elementsPerPage: 100
  });
  @ViewChild('questionInput') questionInput: ElementRef;
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
  
  constructor(private faqDataService: FaqDataService,
    private notificationsService: NotificationsService,
    private paginationService: PaginationService,
    protected modalService: NgbModal,
    private router: Router,
    private cdRef: ChangeDetectorRef,
    private translate: TranslateService) {
    const currentUrl = this.router.url;
    this.url = currentUrl;
      this.pageConfig.id = 'faq'
     
  }
  ngOnInit(): void {
     this.loadData();
  }

  loadData() {
    this.paginationService.resetPage(this.pageConfig.id);
    this.paginationService.getFindListOptions(this.pageConfig.id, this.config).pipe(
        switchMap((config) => this.faqDataService.searchBy('getByStatus?status=faq', config, true, this.isEdit))
      ).subscribe((value: any) => {
        this.faq.next(value);
      });
  }

  saveTypedValue(item:string) {
    this.answer = item;
  }

  focusQuestionInput() {
    setTimeout(() => {
      this.questionInput?.nativeElement.focus();
    });
  }

  editMasterValue(item: any) {
   // console.log(item);
    if (this.isEditRunning === false) {
      this.question = item.question;
      this.answer = item.answers;
      this.isEdit = true;
      this.itemId = item.id;
      this.isEditRunning = true;
      this.focusQuestionInput(); // Focus on question input when editing
      // item.isEdit = true;
      this.cdRef.detectChanges();
    } else {
      this.notificationsService.error(this.translate.get('faq.label.notificationerror'));
    }
  }
  cancel() {
    // item.isEdit = false;
    this.isEdit = false;
    this.question = '';
    this.answer = '';
    this.isEditRunning = false;
    this.cdRef.detectChanges();
  }

  public deleteMasterValue(item: any, content) {
    this.modalService.open(content).result.then(
      (result) => {
        if (result === 'ok') {
          this.faqDataService.deleteFAQs(item.uuid).pipe().subscribe((data) => {
            if (data.state === "Success" || data.statusCode === 204) {
              this.notificationsService.success(this.translate.get('faq.notification.delete'), { name: "" });
              this.loadData();
            } else {
              this.notificationsService.error(this.translate.get('faq.notification.somethingwrong'), { name: "" });
            }
          })
        }
      }
    );
  }

  updateFAQ() {
    if (this.question !== "" && this.answer !== "") {
      let data = {};
        data = {
          question: this.question,
          answers: this.answer,
          status: "faq"
        }
      
      this.faqDataService.updateAnswer(data, this.itemId).pipe().subscribe((data) => {
        if (data.state === "Success") {
          this.isEditRunning = false;
          this.isEdit = false;
          this.question = "";
          this.answer = "";
          this.notificationsService.success(this.translate.get('faq.notification.update'));
          this.loadData();
        }
      });
    } else {
      this.notificationsService.error(this.translate.get('faq.notification.fieldnullerror'));
    }
  }

  submit() {
    if(!this.question || !this.answer) {
      this.notificationsService.error(this.translate.get('faq.notification.qaneeded'));
      return;
    }
    let data = {}
       data = {
        question: this.question,
        answers: this.answer,
        status: "faq"
      }
    
    
    this.faqDataService.submitAnswer(data).pipe().subscribe((data) => {
      if (data.state === "Success") {
        this.loadData();
        this.question = "";
        this.answer = "";
        this.notificationsService.success(this.translate.get('faq.notification.qaadded'));
      }
    })
  }

  async drop(event: CdkDragDrop<any[]>) {
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    console.log(event.container.data);
  
    const updatePromises = event.container.data.map(async (child, i) => {
      child.index = i + 1; // Update index
      try {
        await this.updateToService(child, child.id);
        return true; // Indicate successful update
      } catch (error) {
        console.error("Error updating answer index for item:", child, error);
        return false; // Indicate failed update
      }
    });
  
    // Wait for all updates to finish (or fail)
    const updateResults = await Promise.all(updatePromises);
  
    // Handle update results
    const successfulUpdates = updateResults.filter(result => result === true).length;
    const failedUpdates = updateResults.filter(result => result === false).length;
  
    if (successfulUpdates > 0) {
        this.loadData();
    }
  
    if (failedUpdates > 0) {
      console.warn(`${failedUpdates} update(s) failed. Check the console for details.`);
      // Optionally display a user-friendly error message
    }
  }
  
  async updateToService(child: any, id: string) {
    let data: {};
      data = {
        question: child.question,
        answers: child.answers,
        status: "faq",
        index: child.index,
      };   
    await this.faqDataService.updateAnswerIndex(data, id);
  }

}
