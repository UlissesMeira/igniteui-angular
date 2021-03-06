
import { DebugElement } from '@angular/core';
import { TestBed, async, fakeAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { IgxColumnPinningComponent } from '../pinning/column-pinning.component';
import { IgxColumnPinningModule } from '../pinning/pinning.module';
import { IgxGridComponent } from './grid.component';
import { IPinColumnEventArgs } from '../common/events';
import { IgxGridModule } from './index';
import { IgxButtonModule } from '../../directives/button/button.directive';
import { HelperUtils } from '../../test-utils/helper-utils.spec';
import { ColumnPinningTestComponent, ColumnGroupsPinningTestComponent,
     ColumnPinningWithTemplateTestComponent } from '../../test-utils/grid-base-components.spec';
import { GridFunctions } from '../../test-utils/grid-functions.spec';
import { configureTestSuite } from '../../test-utils/configure-suite';
import { UIInteractions } from '../../test-utils/ui-interactions.spec';

describe('Column Pinning UI #grid', () => {
    configureTestSuite();
    let fix;
    let grid: IgxGridComponent;
    let columnChooser: IgxColumnPinningComponent;
    let columnChooserElement: DebugElement;

    const verifyCheckbox = HelperUtils.verifyCheckbox;
    const verifyColumnIsPinned = GridFunctions.verifyColumnIsPinned;

    beforeAll(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                ColumnPinningTestComponent,
                ColumnGroupsPinningTestComponent,
                ColumnPinningWithTemplateTestComponent
            ],
            imports: [
                NoopAnimationsModule,
                IgxGridModule,
                IgxColumnPinningModule,
                IgxButtonModule
            ]
        })
        .compileComponents();
    }));

    describe('', () => {
        beforeEach(fakeAsync(/** height/width setter rAF */() => {
            fix = TestBed.createComponent(ColumnPinningTestComponent);
            fix.detectChanges();
            grid = fix.componentInstance.grid;
            columnChooser = fix.componentInstance.chooser;
            columnChooserElement = fix.debugElement.query(By.css('igx-column-pinning'));
        }));

        afterAll(() => {
            UIInteractions.clearOverlay();
        });

        it ('title is initially empty.', async(() => {
            const title = columnChooserElement.query(By.css('h4'));
            expect(title).toBe(null);
        }));

        it ('title can be successfully changed.', async(() => {
            columnChooser.title = 'Pin/Unpin Columns';
            fix.detectChanges();

            const titleElement = (columnChooserElement.query(By.css('h4')).nativeElement as HTMLHeadingElement);
            expect(columnChooser.title).toBe('Pin/Unpin Columns');
            expect(titleElement.textContent).toBe('Pin/Unpin Columns');

            columnChooser.title = undefined;
            fix.detectChanges();

            expect(columnChooserElement.query(By.css('h4'))).toBe(null);
            expect(columnChooser.title).toBe('');

            columnChooser.title = null;
            fix.detectChanges();

            expect(columnChooserElement.query(By.css('h4'))).toBe(null);
            expect(columnChooser.title).toBe('');
        }));

        it('filter input visibility is controlled via \'disableFilter\' property.', () => {
            let filterInputElement = columnChooserElement.query(By.css('.igx-column-hiding__header-input'));
            expect(filterInputElement).not.toBeNull();

            fix.componentInstance.disableFilter = true;
            fix.detectChanges();

            filterInputElement = columnChooserElement.query(By.css('.igx-column-hiding__header-input'));
            expect(filterInputElement).toBeNull();

            fix.componentInstance.disableFilter = false;
            fix.detectChanges();

            filterInputElement = columnChooserElement.query(By.css('.igx-column-hiding__header-input'));
            expect(filterInputElement).not.toBeNull();
        });
        it('shows all checkboxes unchecked.', async(() => {
            const checkboxes = GridFunctions.getCheckboxInputs(columnChooserElement);
            expect(checkboxes.filter((chk) => !chk.checked).length).toBe(5);
        }));

        it('- toggling column checkbox checked state successfully changes the column\'s pinned state.', async(() => {
            const checkbox = HelperUtils.getCheckboxInput('ReleaseDate', columnChooserElement, fix);
            verifyCheckbox('ReleaseDate', false, false, columnChooserElement, fix);

            const column = grid.getColumnByName('ReleaseDate');
            verifyColumnIsPinned(column, false, 0);

            checkbox.click();

            expect(checkbox.checked).toBe(true);
            verifyColumnIsPinned(column, true, 1);

            checkbox.click();

            expect(checkbox.checked).toBe(false);
            verifyColumnIsPinned(column, false, 0);
        }));

        it('reflects properly grid column pinned value changes.', async(() => {
            const name = 'ReleaseDate';
            verifyCheckbox(name, false, false, columnChooserElement, fix);
            const column = grid.getColumnByName(name);

            column.pinned = true;
            fix.detectChanges();

            verifyCheckbox(name, true, false, columnChooserElement, fix);
            verifyColumnIsPinned(column, true, 1);

            column.pinned = false;
            fix.detectChanges();

            verifyCheckbox(name, false, false, columnChooserElement, fix);
            verifyColumnIsPinned(column, false, 0);

            column.pinned = undefined;
            fix.detectChanges();

            verifyCheckbox(name, false, false, columnChooserElement, fix);
            verifyColumnIsPinned(column, false, 0);

            column.pinned = true;
            fix.detectChanges();
            verifyColumnIsPinned(column, true, 1);

            column.pinned = null;
            fix.detectChanges();

            verifyCheckbox(name, false, false, columnChooserElement, fix);
            verifyColumnIsPinned(column, false, 0);
        }));

        it('onColumnPinning event is fired on toggling checkboxes.', async(() => {
            let currentArgs: IPinColumnEventArgs;
            let counter = 0;
            grid.onColumnPinning.subscribe((args: IPinColumnEventArgs) => {
                counter++;
                currentArgs = args;
            });

            GridFunctions.getCheckboxInput('ReleaseDate', columnChooserElement, fix).click();

            expect(counter).toBe(1);
            expect(currentArgs.column.field).toBe('ReleaseDate');
            expect(currentArgs.insertAtIndex).toBe(0);
            expect(currentArgs.isPinned).toBe(true);

            GridFunctions.getCheckboxInput('Downloads', columnChooserElement, fix).click();

            expect(counter).toBe(2);
            expect(currentArgs.column.field).toBe('Downloads');
            expect(currentArgs.insertAtIndex).toBe(1);
            expect(currentArgs.isPinned).toBe(true);

            GridFunctions.getCheckboxInput('ReleaseDate', columnChooserElement, fix).click();

            // When unpinning columns onColumnPinning event should be fired
            expect(counter).toBe(3);
            expect(currentArgs.column.field).toBe('ReleaseDate');
            expect(currentArgs.insertAtIndex).toBe(3);
            expect(currentArgs.isPinned).toBe(false);

            GridFunctions.getCheckboxInput('Downloads', columnChooserElement, fix).click();

            expect(counter).toBe(4);
            expect(currentArgs.column.field).toBe('Downloads');
            expect(currentArgs.insertAtIndex).toBe(2);
            expect(currentArgs.isPinned).toBe(false);

            GridFunctions.getCheckboxInput('ProductName', columnChooserElement, fix).click();

            expect(counter).toBe(5);
            expect(currentArgs.column.field).toBe('ProductName');
            expect(currentArgs.insertAtIndex).toBe(0);
            expect(currentArgs.isPinned).toBe(true);
        }));

        it('onColumnPinning event should fire when pinning and unpining using api', async(() => {
            let currentArgs: IPinColumnEventArgs;
            let counter = 0;
            grid.onColumnPinning.subscribe((args: IPinColumnEventArgs) => {
                counter++;
                currentArgs = args;
            });

            grid.columns[0].pin();
            expect(counter).toBe(1);
            expect(currentArgs.column.field).toBe('ID');
            expect(currentArgs.insertAtIndex).toBe(0);
            expect(currentArgs.isPinned).toBe(true);

            // onColumnPinning should not be fired if column is already pinned
            grid.columns[0].pin();
            expect(counter).toBe(1);

            grid.columns[0].unpin();
            expect(counter).toBe(2);
            expect(currentArgs.column.field).toBe('ID');
            expect(currentArgs.insertAtIndex).toBe(0);
            expect(currentArgs.isPinned).toBe(false);
        }));

        it('does pin columns if unpinned area width will become less than the defined minimum.', async(() => {
            const checkboxes = GridFunctions.getCheckboxInputs(columnChooserElement);
            checkboxes[0].click();
            checkboxes[1].click();
            checkboxes[2].click();

            verifyColumnIsPinned(grid.columns[0], true, 3);
            verifyColumnIsPinned(grid.columns[1], true, 3);
            verifyColumnIsPinned(grid.columns[2], true, 3);

        }));

        it('- should size cells correctly when there is a large pinned templated column', fakeAsync(/** height/width setter rAF */() => {
            fix = TestBed.createComponent(ColumnPinningWithTemplateTestComponent);
            fix.detectChanges();
            grid = fix.componentInstance.grid;
            // verify all cells have 100px height
            const cells = fix.debugElement.queryAll(By.css('igx-grid-cell'));
            expect(cells.length).toBe(32);
            cells.forEach((cell) => {
                expect(cell.nativeElement.offsetHeight).toBe(100);
            });
        }));

        it('toolbar should contain only pinnable columns', () => {
            grid.showToolbar = true;
            grid.columnPinning = true;
            fix.detectChanges();

            let toolbar = grid.toolbar.columnPinningUI;
            expect(toolbar.pinnableColumns.length).toBe(5);

            grid.columns[0].disablePinning = true;
            fix.detectChanges();

            toolbar = grid.toolbar.columnPinningUI;
            expect(toolbar.pinnableColumns.length).toBe(4);
        });
    });

    describe('', () => {
        beforeEach(fakeAsync(/** height/width setter rAF */() => {
            fix = TestBed.createComponent(ColumnGroupsPinningTestComponent);
            fix.showInline = false;
            fix.showPinningInline = true;
            fix.detectChanges();
            grid = fix.componentInstance.grid;
            columnChooser = fix.componentInstance.chooser;
            columnChooserElement = fix.debugElement.query(By.css('igx-column-pinning'));
        }));

        it('shows only top level columns.', () => {
            const columnItems = columnChooser.columnItems;
            expect(columnItems.length).toBe(3);
            expect(columnItems[0].name).toBe('Missing');
            expect(columnItems[1].name).toBe('General Information');
            expect(columnItems[2].name).toBe('ID');
            expect(getColumnPinningItems().length).toBe(3);
        });

        it('- pinning group column pins all children.', () => {
            fix.detectChanges();
            const columnName = 'General Information';
            GridFunctions.getCheckboxInput('Missing', columnChooserElement, fix).click();
            GridFunctions.getCheckboxInput(columnName, columnChooserElement, fix).click();

            fix.detectChanges();
            verifyCheckbox(columnName, true, false, columnChooserElement, fix);
            expect(grid.columns[1].allChildren.every((col) => col.pinned)).toBe(true);
        });


        it('- unpinning group column unpins all children.', () => {
            const columnName = 'General Information';
            grid.columns[0].unpin();
            grid.columns[1].pin();
            fix.detectChanges();

            verifyCheckbox(columnName, true, false, columnChooserElement, fix);
            expect(grid.columns[1].allChildren.every((col) => col.pinned)).toBe(true);

            GridFunctions.getCheckboxInput(columnName, columnChooserElement, fix).click();

            fix.detectChanges();
            verifyCheckbox(columnName, false, false, columnChooserElement, fix);
            expect(grid.columns[1].allChildren.every((col) => !col.pinned)).toBe(true);
        });
    });

    function getColumnPinningItems() {
        if (!columnChooserElement) {
            columnChooserElement = fix.debugElement.query(By.css('igx-column-pinning'));
        }
        const checkboxElements = columnChooserElement.queryAll(By.css('igx-checkbox'));
        return checkboxElements;
    }
});
