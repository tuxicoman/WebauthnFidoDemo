import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LogOutputComponent } from './log-output.component';

describe('LogOutputComponent', () => {
  let component: LogOutputComponent;
  let fixture: ComponentFixture<LogOutputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LogOutputComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LogOutputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
