import { DebugElement, ViewChild, Component } from '@angular/core';
import { TestBed, async, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { IgxGridComponent } from './grid.component';
import { IgxGridModule } from './index';
import { configureTestSuite } from '../../test-utils/configure-suite';
import { ColumnPinningPosition, RowPinningPosition } from '../common/enums';
import { IPinningConfig } from '../common/grid.interface';
import { SampleTestData } from '../../test-utils/sample-test-data.spec';
import { verifyLayoutHeadersAreAligned, verifyDOMMatchesLayoutSettings } from '../../test-utils/helper-utils.spec';
import { GridFunctions } from '../../test-utils/grid-functions.spec';
import { SortingDirection } from '../../data-operations/sorting-expression.interface';
import { IgxGridTransaction } from '../tree-grid';
import { IgxTransactionService } from '../../services';
import { GridSummaryFunctions } from '../../test-utils/grid-functions.spec';
import { IgxStringFilteringOperand } from '../../data-operations/filtering-condition';

describe('Row Pinning #grid', () => {
    const FIXED_ROW_CONTAINER = '.igx-grid__tr--pinned ';
    const CELL_CSS_CLASS = '.igx-grid__td';
    configureTestSuite();
    let fix;
    let grid: IgxGridComponent;

    beforeAll(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                GridRowPinningComponent,
                GridRowPinningWithMRLComponent,
                GridRowPinningWithMDVComponent,
                GridRowPinningWithTransactionsComponent
            ],
            imports: [
                NoopAnimationsModule,
                IgxGridModule
            ]
        })
            .compileComponents();
    }));

    describe('', () => {
        beforeEach(fakeAsync(() => {
            fix = TestBed.createComponent(GridRowPinningComponent);
            fix.detectChanges();
            grid = fix.componentInstance.instance;
            tick();
            fix.detectChanges();
        }));

        it('should pin rows to top.', () => {
            // pin 2nd data row
            grid.pinRow(fix.componentInstance.data[1]);
            fix.detectChanges();

            expect(grid.pinnedRows.length).toBe(1);
            let pinRowContainer = fix.debugElement.queryAll(By.css(FIXED_ROW_CONTAINER));
            expect(pinRowContainer.length).toBe(1);
            expect(pinRowContainer[0].children.length).toBe(1);
            expect(pinRowContainer[0].children[0].context.rowID).toBe(fix.componentInstance.data[1]);
            expect(pinRowContainer[0].children[0].nativeElement).toBe(grid.getRowByIndex(0).nativeElement);

            expect(grid.getRowByIndex(1).rowID).toBe(fix.componentInstance.data[0]);
            expect(grid.getRowByIndex(2).rowID).toBe(fix.componentInstance.data[2]);

            // pin 3rd data row
            grid.pinRow(fix.componentInstance.data[2]);
            fix.detectChanges();

            pinRowContainer = fix.debugElement.queryAll(By.css(FIXED_ROW_CONTAINER));
            expect(pinRowContainer[0].children.length).toBe(2);
            expect(pinRowContainer[0].children[0].context.rowID).toBe(fix.componentInstance.data[1]);
            expect(pinRowContainer[0].children[1].context.rowID).toBe(fix.componentInstance.data[2]);

            expect(grid.getRowByIndex(2).rowID).toBe(fix.componentInstance.data[0]);
            expect(grid.getRowByIndex(3).rowID).toBe(fix.componentInstance.data[3]);

            // 2 records pinned + 2px border
            expect(grid.pinnedRowHeight).toBe(2 * grid.renderedRowHeight + 2);
            const expectedHeight = parseInt(grid.height, 10) - grid.pinnedRowHeight - 18 - grid.theadRow.nativeElement.offsetHeight;
            expect(grid.calcHeight - expectedHeight).toBeLessThanOrEqual(1);
        });

        it('should pin rows to bottom.', () => {
            fix.componentInstance.pinningConfig = { columns: ColumnPinningPosition.Start, rows: RowPinningPosition.Bottom };
            fix.detectChanges();

            // pin 2nd
            grid.pinRow(fix.componentInstance.data[1]);
            fix.detectChanges();

            expect(grid.pinnedRows.length).toBe(1);
            let pinRowContainer = fix.debugElement.queryAll(By.css(FIXED_ROW_CONTAINER));
            expect(pinRowContainer.length).toBe(1);
            expect(pinRowContainer[0].children.length).toBe(1);
            expect(pinRowContainer[0].children[0].context.rowID).toBe(fix.componentInstance.data[1]);
            expect(pinRowContainer[0].children[0].context.index).toBe(fix.componentInstance.data.length - 1);
            expect(pinRowContainer[0].children[0].nativeElement)
                .toBe(grid.getRowByIndex(fix.componentInstance.data.length - 1).nativeElement);

            expect(grid.getRowByIndex(0).rowID).toBe(fix.componentInstance.data[0]);
            expect(grid.getRowByIndex(1).rowID).toBe(fix.componentInstance.data[2]);

            // pin 1st
            grid.pinRow(fix.componentInstance.data[0]);
            fix.detectChanges();

            pinRowContainer = fix.debugElement.queryAll(By.css(FIXED_ROW_CONTAINER));
            expect(pinRowContainer[0].children.length).toBe(2);
            expect(pinRowContainer[0].children[0].context.rowID).toBe(fix.componentInstance.data[1]);
            expect(pinRowContainer[0].children[1].context.rowID).toBe(fix.componentInstance.data[0]);

            // check last pinned is fully in view
            const last = pinRowContainer[0].children[1].context.nativeElement;
            expect(last.getBoundingClientRect().bottom - grid.tbody.nativeElement.getBoundingClientRect().bottom).toBe(0);

            // 2 records pinned + 2px border
            expect(grid.pinnedRowHeight).toBe(2 * grid.renderedRowHeight + 2);
            const expectedHeight = parseInt(grid.height, 10) - grid.pinnedRowHeight - 18 - grid.theadRow.nativeElement.offsetHeight;
            expect(grid.calcHeight - expectedHeight).toBeLessThanOrEqual(1);
        });

        it('should allow pinning row at specified index via API.', () => {
            grid.pinRow(fix.componentInstance.data[1]);
            fix.detectChanges();

            expect(grid.pinnedRows.length).toBe(1);
            expect(grid.pinnedRows[0].rowData).toBe(fix.componentInstance.data[1]);

            // pin at index 0
            grid.pinRow(fix.componentInstance.data[2], 0);
            fix.detectChanges();

            expect(grid.pinnedRows.length).toBe(2);
            expect(grid.pinnedRows[0].rowData).toBe(fix.componentInstance.data[2]);
            expect(grid.pinnedRows[1].rowData).toBe(fix.componentInstance.data[1]);

            // pin at index 1
            grid.pinRow(fix.componentInstance.data[3], 1);
            fix.detectChanges();

            expect(grid.pinnedRows.length).toBe(3);
            expect(grid.pinnedRows[0].rowData).toBe(fix.componentInstance.data[2]);
            expect(grid.pinnedRows[1].rowData).toBe(fix.componentInstance.data[3]);
            expect(grid.pinnedRows[2].rowData).toBe(fix.componentInstance.data[1]);
        });

        it('should emit onRowPinning on pin/unpin.', () => {
            spyOn(grid.onRowPinning, 'emit').and.callThrough();

            let row = grid.getRowByIndex(0);
            let rowID = row.rowID;
            row.pin();
            fix.detectChanges();

            expect(grid.onRowPinning.emit).toHaveBeenCalledTimes(1);
            expect(grid.onRowPinning.emit).toHaveBeenCalledWith({
                row: row,
                rowID: rowID,
                insertAtIndex: undefined,
                isPinned: true
            });

            row = grid.getRowByIndex(0);
            rowID = row.rowID;
            row.unpin();
            fix.detectChanges();

            expect(grid.onRowPinning.emit).toHaveBeenCalledTimes(2);
        });

        it('should pin/unpin via grid API methods.', () => {
            // pin 2nd row
            grid.pinRow(fix.componentInstance.data[1]);
            fix.detectChanges();

            expect(grid.pinnedRows.length).toBe(1);
            let pinRowContainer = fix.debugElement.queryAll(By.css(FIXED_ROW_CONTAINER));
            expect(pinRowContainer.length).toBe(1);
            expect(pinRowContainer[0].children.length).toBe(1);
            expect(pinRowContainer[0].children[0].context.rowID).toBe(fix.componentInstance.data[1]);
            expect(pinRowContainer[0].children[0].context.index).toBe(0);
            expect(pinRowContainer[0].children[0].nativeElement).toBe(grid.getRowByIndex(0).nativeElement);

            expect(grid.getRowByIndex(0).rowID).toBe(fix.componentInstance.data[1]);
            expect(grid.getRowByIndex(1).rowID).toBe(fix.componentInstance.data[0]);

            // unpin 2nd row
            grid.unpinRow(fix.componentInstance.data[1]);
            fix.detectChanges();

            expect(grid.pinnedRows.length).toBe(0);
            pinRowContainer = fix.debugElement.queryAll(By.css(FIXED_ROW_CONTAINER));
            expect(pinRowContainer.length).toBe(0);

            expect(grid.getRowByIndex(0).rowID).toBe(fix.componentInstance.data[0]);
            expect(grid.getRowByIndex(1).rowID).toBe(fix.componentInstance.data[1]);
        });

        it('should pin/unpin via row API methods.', () => {
            // pin 2nd row
            let row = grid.getRowByIndex(1);
            row.pin();
            fix.detectChanges();

            expect(grid.pinnedRows.length).toBe(1);
            let pinRowContainer = fix.debugElement.queryAll(By.css(FIXED_ROW_CONTAINER));
            expect(pinRowContainer.length).toBe(1);
            expect(pinRowContainer[0].children.length).toBe(1);
            expect(pinRowContainer[0].children[0].context.rowID).toBe(fix.componentInstance.data[1]);

            expect(grid.getRowByIndex(0).rowID).toBe(fix.componentInstance.data[1]);
            expect(grid.getRowByIndex(1).rowID).toBe(fix.componentInstance.data[0]);

            // unpin
            row = grid.getRowByIndex(0);
            row.unpin();
            fix.detectChanges();

            expect(grid.pinnedRows.length).toBe(0);
            pinRowContainer = fix.debugElement.queryAll(By.css(FIXED_ROW_CONTAINER));
            expect(pinRowContainer.length).toBe(0);

            expect(grid.getRowByIndex(0).rowID).toBe(fix.componentInstance.data[0]);
            expect(grid.getRowByIndex(1).rowID).toBe(fix.componentInstance.data[1]);
        });

        it('should pin/unpin via row pinned setter.', () => {
            // pin 2nd row
            let row = grid.getRowByIndex(1);
            row.pinned = true;
            fix.detectChanges();

            expect(grid.pinnedRows.length).toBe(1);
            let pinRowContainer = fix.debugElement.queryAll(By.css(FIXED_ROW_CONTAINER));
            expect(pinRowContainer.length).toBe(1);
            expect(pinRowContainer[0].children.length).toBe(1);
            expect(pinRowContainer[0].children[0].context.rowID).toBe(fix.componentInstance.data[1]);

            expect(grid.getRowByIndex(0).rowID).toBe(fix.componentInstance.data[1]);
            expect(grid.getRowByIndex(1).rowID).toBe(fix.componentInstance.data[0]);

            // unpin
            row = grid.getRowByIndex(0);
            row.pinned = false;
            fix.detectChanges();

            expect(grid.pinnedRows.length).toBe(0);
            pinRowContainer = fix.debugElement.queryAll(By.css(FIXED_ROW_CONTAINER));
            expect(pinRowContainer.length).toBe(0);

            expect(grid.getRowByIndex(0).rowID).toBe(fix.componentInstance.data[0]);
            expect(grid.getRowByIndex(1).rowID).toBe(fix.componentInstance.data[1]);
        });

        it('should search in both pinned and unpinned rows.', () => {
            // pin 1st row
            let row = grid.getRowByIndex(0);
            row.pinned = true;
            fix.detectChanges();
            expect(grid.pinnedRows.length).toBe(1);

            let finds = grid.findNext('mari');
            fix.detectChanges();

            const fixNativeElement = fix.debugElement.nativeElement;
            let spans = fixNativeElement.querySelectorAll('.igx-highlight');
            expect(spans.length).toBe(1);
            expect(finds).toEqual(2);

            finds = grid.findNext('antonio');
            fix.detectChanges();

            spans = fixNativeElement.querySelectorAll('.igx-highlight');
            expect(spans.length).toBe(2);
            expect(finds).toEqual(2);

            // pin 3rd row
            row = grid.getRowByIndex(2);
            row.pinned = true;
            fix.detectChanges();
            expect(grid.pinnedRows.length).toBe(2);

            finds = grid.findNext('antonio');
            fix.detectChanges();

            spans = fixNativeElement.querySelectorAll('.igx-highlight');
            expect(spans.length).toBe(2);
            expect(finds).toEqual(2);
        });

        it('should allow pinning onInit', () => {
            expect(() => {
                fix = TestBed.createComponent(GridRowPinningComponent);
                grid = fix.componentInstance.instance;
                grid.pinRow(fix.componentInstance.data[1]);
                fix.detectChanges();
            }).not.toThrow();
            expect(grid.pinnedRows.length).toBe(1);
            expect(grid.getRowByIndex(0).rowID).toBe(fix.componentInstance.data[1]);
        });

        it('should pin rows when columns are grouped.', () => {
            grid.height = '550px';
            fix.detectChanges();
            // pin 1st and 2nd data row
            grid.pinRow(fix.componentInstance.data[0]);
            grid.pinRow(fix.componentInstance.data[1]);
            fix.detectChanges();

            // group by string column
            grid.groupBy({
                fieldName: 'ContactTitle', dir: SortingDirection.Desc, ignoreCase: false
            });
            fix.detectChanges();

            expect(grid.pinnedRows.length).toBe(2);

            // verify rows
            const groupRows = grid.groupsRowList.toArray();
            const dataRows = grid.dataRowList.toArray();

            expect(groupRows.length).toEqual(2);
            expect(dataRows.length).toEqual(7);
            expect(groupRows[0].groupRow.records[0].ID).toEqual('AROUT');

            // pin 4th data row with ID:AROUT
            grid.pinRow(fix.componentInstance.data[3]);
            fix.detectChanges();

            expect(grid.pinnedRows.length).toBe(3);

            // make sure the pinned row is out of the first groupBy group
            expect(groupRows[0].groupRow.records[0].ID).toEqual('BLAUS');
        });

        it('should apply filtering to both pinned and unpinned rows.', () => {
            grid.getRowByIndex(1).pin();
            fix.detectChanges();
            grid.getRowByIndex(5).pin();
            fix.detectChanges();

            let pinRowContainer = fix.debugElement.queryAll(By.css(FIXED_ROW_CONTAINER));
            expect(pinRowContainer[0].children.length).toBe(2);
            expect(pinRowContainer[0].children[0].context.rowID).toBe(fix.componentInstance.data[1]);
            expect(pinRowContainer[0].children[1].context.rowID).toBe(fix.componentInstance.data[5]);

            grid.filter('ID', 'B', IgxStringFilteringOperand.instance().condition('contains'), false);
            fix.detectChanges();

            pinRowContainer = fix.debugElement.queryAll(By.css(FIXED_ROW_CONTAINER));
            expect(pinRowContainer[0].children.length).toBe(1);
            expect(pinRowContainer[0].children[0].context.rowID).toBe(fix.componentInstance.data[5]);
        });

        it('should remove pinned container and recalculate sizes when all pinned records are filtered out.', () => {
            grid.getRowByIndex(1).pin();
            fix.detectChanges();
            let pinRowContainer = fix.debugElement.queryAll(By.css(FIXED_ROW_CONTAINER));
            expect(pinRowContainer.length).toBe(1);

            let expectedHeight = parseInt(grid.height, 10) - grid.pinnedRowHeight - 18 -  grid.theadRow.nativeElement.offsetHeight;
            expect(grid.calcHeight - expectedHeight).toBeLessThanOrEqual(1);

            grid.filter('ID', 'B', IgxStringFilteringOperand.instance().condition('startsWith'), false);
            fix.detectChanges();

            pinRowContainer = fix.debugElement.queryAll(By.css(FIXED_ROW_CONTAINER));
            expect(pinRowContainer.length).toBe(0);

            expect(grid.pinnedRowHeight).toBe(0);
            expectedHeight = parseInt(grid.height, 10) - grid.pinnedRowHeight - 18 -  grid.theadRow.nativeElement.offsetHeight;
            expect(grid.calcHeight - expectedHeight).toBeLessThanOrEqual(1);
        });

        it('should return correct filterData collection.', () => {
            grid.getRowByIndex(1).pin();
            fix.detectChanges();
            grid.getRowByIndex(5).pin();
            fix.detectChanges();

            grid.filter('ID', 'B', IgxStringFilteringOperand.instance().condition('contains'), false);
            fix.detectChanges();

            let gridFilterData = grid.filteredData;
            expect(gridFilterData.length).toBe(7);
            expect(gridFilterData[0].ID).toBe('BLAUS');
            expect(gridFilterData[1].ID).toBe('BERGS');

            fix.componentInstance.pinningConfig = { columns: ColumnPinningPosition.Start, rows: RowPinningPosition.Bottom };
            fix.detectChanges();

            gridFilterData = grid.filteredData;
            expect(gridFilterData.length).toBe(7);
            expect(gridFilterData[0].ID).toBe('BLAUS');
            expect(gridFilterData[1].ID).toBe('BERGS');
        });

        it('should page through unpinned collection with modified pageSize = pageSize - pinnedRows.lenght.', () => {
            // pin 2nd row
            grid.paging = true;
            grid.perPage = 5;
            fix.detectChanges();
            let row = grid.getRowByIndex(1);
            row.pin();
            fix.detectChanges();

            expect(grid.pinnedRows.length).toBe(1);
            let pinRowContainer = fix.debugElement.queryAll(By.css(FIXED_ROW_CONTAINER));
            expect(pinRowContainer.length).toBe(1);

            expect(grid.dataView.length).toBe(4);

            // unpin
            row = grid.getRowByIndex(0);
            row.unpin();
            fix.detectChanges();

            expect(grid.pinnedRows.length).toBe(0);
            pinRowContainer = fix.debugElement.queryAll(By.css(FIXED_ROW_CONTAINER));
            expect(pinRowContainer.length).toBe(0);

            expect(grid.dataView.length).toBe(5);
        });

        it('should apply sorting to both pinned and unpinned rows.', () => {
            grid.getRowByIndex(1).pin();
            grid.getRowByIndex(5).pin();
            fix.detectChanges();

            expect(grid.getRowByIndex(0).rowID).toBe(fix.componentInstance.data[1]);
            expect(grid.getRowByIndex(1).rowID).toBe(fix.componentInstance.data[5]);

            grid.sort({ fieldName: 'ID', dir: SortingDirection.Desc, ignoreCase: false });
            fix.detectChanges();

            // check pinned rows data is sorted
            expect(grid.getRowByIndex(0).rowID).toBe(fix.componentInstance.data[5]);
            expect(grid.getRowByIndex(1).rowID).toBe(fix.componentInstance.data[1]);

            // check unpinned rows data is sorted
            const lastIndex = fix.componentInstance.data.length - 1;
            expect(grid.getRowByIndex(2).rowID).toBe(fix.componentInstance.data[lastIndex]);
        });
    });
    describe('Row pinning with Master Detail View', () => {
        beforeEach(fakeAsync(() => {
            fix = TestBed.createComponent(GridRowPinningWithMDVComponent);
            fix.detectChanges();
            grid = fix.componentInstance.instance;
            tick();
            fix.detectChanges();
        }));

        it('should be in view when expanded and pinning row to bottom of the grid.', () => {
            fix.componentInstance.pinningConfig = { columns: ColumnPinningPosition.Start, rows: RowPinningPosition.Bottom };
            fix.detectChanges();
            // pin 1st row
            const row = grid.getRowByIndex(0);
            row.pinned = true;
            fix.detectChanges();

            GridFunctions.toggleMasterRow(fix, grid.pinnedRows[0]);
            fix.detectChanges();


            expect(grid.pinnedRows.length).toBe(1);

            const firstRowIconName = GridFunctions.getRowExpandIconName(grid.pinnedRows[0]);
            const firstRowDetail = GridFunctions.getMasterRowDetail(grid.pinnedRows[0]);
            expect(grid.expansionStates.size).toEqual(1);
            expect(grid.expansionStates.has(grid.pinnedRows[0].rowID)).toBeTruthy();
            expect(grid.expansionStates.get(grid.pinnedRows[0].rowID)).toBeTruthy();
            expect(firstRowIconName).toEqual('expand_more');

            // check last pinned and expanded is fully in view
            expect(firstRowDetail.getBoundingClientRect().bottom - grid.tbody.nativeElement.getBoundingClientRect().bottom).toBe(0);
        });

        it('should calculate global summaries with both pinned and unpinned collections', () => {
            // enable summaries for each column
            grid.columns.forEach(c => {
                c.hasSummary = true;
            });
            fix.detectChanges();

            grid.groupBy({
                fieldName: 'ContactTitle', dir: SortingDirection.Asc, ignoreCase: false
            });
            fix.detectChanges();

            let row = grid.getRowByIndex(1);
            row.pinned = true;
            fix.detectChanges();
            let summaryRow = GridSummaryFunctions.getRootSummaryRow(fix);
            GridSummaryFunctions.verifyColumnSummaries(summaryRow, 0, ['Count'], ['27']);

            row = grid.pinnedRows[0];
            row.pinned = false;
            fix.detectChanges();
            expect(grid.pinnedRows.length).toBe(0);
            summaryRow = GridSummaryFunctions.getRootSummaryRow(fix);
            GridSummaryFunctions.verifyColumnSummaries(summaryRow, 0, ['Count'], ['27']);
        });

        it('should calculate groupby row summaries only within unpinned collection', () => {
            // enable summaries for each column
            grid.columns.forEach(c => {
                c.hasSummary = true;
            });
            fix.detectChanges();

            grid.groupBy({
                fieldName: 'ContactTitle', dir: SortingDirection.Asc, ignoreCase: false
            });
            fix.detectChanges();

            let row = grid.getRowByIndex(1);
            row.pinned = true;
            fix.detectChanges();

            expect(grid.pinnedRows.length).toBe(1);

            // get first summary row and make sure that the pinned record is not contained within the calculations
            let summaryRow = GridSummaryFunctions.getSummaryRowByDataRowIndex(fix, 3);
            GridSummaryFunctions.verifyColumnSummaries(summaryRow, 0, ['Count'], ['1']);

            // unpin the row and check if the summary is recalculated
            row = grid.pinnedRows[0];
            row.pinned = false;
            fix.detectChanges();
            expect(grid.pinnedRows.length).toBe(0);
            summaryRow = GridSummaryFunctions.getSummaryRowByDataRowIndex(fix, 3);
            GridSummaryFunctions.verifyColumnSummaries(summaryRow, 0, ['Count'], ['2']);
        });
    });

    describe(' Editing ', () => {
        beforeEach(fakeAsync(() => {
            fix = TestBed.createComponent(GridRowPinningWithTransactionsComponent);
            fix.detectChanges();
            grid = fix.componentInstance.instance;
            tick();
            fix.detectChanges();
        }));

        it('should allow pinning edited row.', () => {
            grid.updateCell('New value', 'ANTON', 'CompanyName');
            fix.detectChanges();
            grid.pinRow('ANTON');
            fix.detectChanges();

            expect(grid.pinnedRows.length).toBe(1);
            const pinRowContainer = fix.debugElement.queryAll(By.css(FIXED_ROW_CONTAINER));
            expect(pinRowContainer.length).toBe(1);
            expect(pinRowContainer[0].children.length).toBe(1);
            expect(pinRowContainer[0].children[0].context.rowID).toBe('ANTON');
            expect(pinRowContainer[0].children[0].context.rowData.CompanyName).toBe('New value');
        });

        it('should allow pinning deleted row.', () => {
            grid.deleteRow('ALFKI');
            fix.detectChanges();
            grid.pinRow('ALFKI');
            fix.detectChanges();

            expect(grid.pinnedRows.length).toBe(1);
            const pinRowContainer = fix.debugElement.queryAll(By.css(FIXED_ROW_CONTAINER));
            expect(pinRowContainer.length).toBe(1);
            expect(pinRowContainer[0].children.length).toBe(1);
            expect(pinRowContainer[0].children[0].context.rowID).toBe('ALFKI');
        });

        it('should allow pinning added row.', () => {

            grid.addRow({ 'ID': 'Test', 'CompanyName': 'Test' });
            fix.detectChanges();

            grid.pinRow('Test');
            fix.detectChanges();
            expect(grid.pinnedRows.length).toBe(1);
            const pinRowContainer = fix.debugElement.queryAll(By.css(FIXED_ROW_CONTAINER));
            expect(pinRowContainer.length).toBe(1);
            expect(pinRowContainer[0].children.length).toBe(1);
            expect(pinRowContainer[0].children[0].context.rowID).toBe('Test');
        });

        it('should stop editing when edited row is pinned/unpinned.', () => {
            grid.getColumnByName('CompanyName').editable = true;
            fix.detectChanges();
            let cell = grid.getCellByColumn(0, 'CompanyName');
            let cellDomNumber = fix.debugElement.queryAll(By.css(CELL_CSS_CLASS))[1];
            cellDomNumber.triggerEventHandler('dblclick', {});
            fix.detectChanges();

            expect(cell.editMode).toBeTruthy();

            grid.pinRow(cell.row.rowID);
            fix.detectChanges();

            cell = grid.getCellByColumn(0, 'CompanyName');
            expect(cell.editMode).toBeFalsy();

            cellDomNumber = fix.debugElement.queryAll(By.css(CELL_CSS_CLASS))[1];
            cellDomNumber.triggerEventHandler('dblclick', {});
            fix.detectChanges();

            expect(cell.editMode).toBeTruthy();
            grid.unpinRow(cell.row.rowID);
            fix.detectChanges();
            cell = grid.getCellByColumn(0, 'CompanyName');
            expect(cell.editMode).toBeFalsy();
        });

    });
    describe('Row pinning with MRL', () => {
        beforeEach(fakeAsync(() => {
            fix = TestBed.createComponent(GridRowPinningWithMRLComponent);
            fix.detectChanges();
            grid = fix.componentInstance.instance;
            tick();
            fix.detectChanges();
        }));

        it('should pin/unpin correctly to top', () => {
            // pin
            grid.pinRow(fix.componentInstance.data[1]);
            fix.detectChanges();

            expect(grid.pinnedRows.length).toBe(1);
            const pinRowContainer = fix.debugElement.queryAll(By.css(FIXED_ROW_CONTAINER));
            expect(pinRowContainer.length).toBe(1);
            expect(pinRowContainer[0].children.length).toBe(1);
            expect(pinRowContainer[0].children[0].context.rowID).toBe(fix.componentInstance.data[1]);
            expect(pinRowContainer[0].children[0].nativeElement).toBe(grid.getRowByIndex(0).nativeElement);

            expect(grid.getRowByIndex(0).pinned).toBeTruthy();
            const gridPinnedRow = grid.pinnedRows[0];
            const pinnedRowCells = gridPinnedRow.cells.toArray();
            const headerCells = grid.headerGroups.first.children.toArray();

            // headers are aligned to cells
            verifyLayoutHeadersAreAligned(headerCells, pinnedRowCells);
            verifyDOMMatchesLayoutSettings(gridPinnedRow, fix.componentInstance.colGroups);

            // unpin
            const row = grid.pinnedRows[0];
            row.pinned = false;
            fix.detectChanges();

            expect(grid.pinnedRows.length).toBe(0);
            expect(row.pinned).toBeFalsy();

            const gridUnpinnedRow = grid.getRowByIndex(1);
            const unpinnedRowCells = gridUnpinnedRow.cells.toArray();

            verifyLayoutHeadersAreAligned(headerCells, unpinnedRowCells);
            verifyDOMMatchesLayoutSettings(gridUnpinnedRow, fix.componentInstance.colGroups);
        });

        it('should pin/unpin correctly to bottom', () => {

            fix.componentInstance.pinningConfig = { columns: ColumnPinningPosition.Start, rows: RowPinningPosition.Bottom };
            fix.detectChanges();

            // pin
            grid.pinRow(fix.componentInstance.data[1]);
            fix.detectChanges();

            expect(grid.pinnedRows.length).toBe(1);
            const pinRowContainer = fix.debugElement.queryAll(By.css(FIXED_ROW_CONTAINER));
            expect(pinRowContainer.length).toBe(1);
            expect(pinRowContainer[0].children.length).toBe(1);
            expect(pinRowContainer[0].children[0].context.rowID).toBe(fix.componentInstance.data[1]);
            expect(pinRowContainer[0].children[0].nativeElement)
                .toBe(grid.getRowByIndex(fix.componentInstance.data.length - 1).nativeElement);

            expect(grid.getRowByIndex(fix.componentInstance.data.length - 1).pinned).toBeTruthy();
            const gridPinnedRow = grid.pinnedRows[0];
            const pinnedRowCells = gridPinnedRow.cells.toArray();
            const headerCells = grid.headerGroups.first.children.toArray();

            // headers are aligned to cells
            verifyLayoutHeadersAreAligned(headerCells, pinnedRowCells);
            verifyDOMMatchesLayoutSettings(gridPinnedRow, fix.componentInstance.colGroups);

            // unpin
            const row = grid.pinnedRows[0];
            row.pinned = false;
            fix.detectChanges();

            expect(grid.pinnedRows.length).toBe(0);
            expect(row.pinned).toBeFalsy();

            const gridUnpinnedRow = grid.getRowByIndex(1);
            const unpinnedRowCells = gridUnpinnedRow.cells.toArray();

            verifyLayoutHeadersAreAligned(headerCells, unpinnedRowCells);
            verifyDOMMatchesLayoutSettings(gridUnpinnedRow, fix.componentInstance.colGroups);
        });
    });
    describe(' Hiding', () => {
        beforeEach(fakeAsync(() => {
            fix = TestBed.createComponent(GridRowPinningComponent);
            fix.detectChanges();
            grid = fix.componentInstance.instance;
            tick();
            fix.detectChanges();
        }));

        it('should hide columns in pinned and unpinned area', () => {
            // pin 2nd data row
            grid.pinRow(fix.componentInstance.data[1]);
            fix.detectChanges();
            const hiddenCol = grid.columns[1];
            hiddenCol.hidden = true;
            fix.detectChanges();

            const pinnedCells = grid.pinnedRows[0].cells;
            expect(pinnedCells.filter(cell => cell.column.field === hiddenCol.field).length).toBe(0);

            const unpinnedCells = grid.rowList.first.cells;
            expect(unpinnedCells.filter(cell => cell.column.field === hiddenCol.field).length).toBe(0);

            expect(pinnedCells.length).toBe(unpinnedCells.length);

            const headerCells = grid.headerCellList;
            expect(headerCells.filter(cell => cell.column.field === hiddenCol.field).length).toBe(0);

            expect(grid.pinnedRows.length).toBe(1);
            const pinRowContainer = fix.debugElement.queryAll(By.css(FIXED_ROW_CONTAINER));
            expect(pinRowContainer.length).toBe(1);
            expect(pinRowContainer[0].children.length).toBe(1);
            expect(pinRowContainer[0].children[0].context.rowID).toBe(fix.componentInstance.data[1]);
            expect(pinRowContainer[0].children[0].nativeElement).toBe(grid.getRowByIndex(0).nativeElement);

            expect(grid.getRowByIndex(1).rowID).toBe(fix.componentInstance.data[0]);
            expect(grid.getRowByIndex(2).rowID).toBe(fix.componentInstance.data[2]);

            // 1 records pinned + 2px border
            expect(grid.pinnedRowHeight).toBe(grid.renderedRowHeight + 2);
            const expectedHeight = parseInt(grid.height, 10) - grid.pinnedRowHeight - 18 - grid.theadRow.nativeElement.offsetHeight;
            expect(grid.calcHeight - expectedHeight).toBeLessThanOrEqual(1);
        });
    });
});

@Component({
    template: `
        <igx-grid
            [allowFiltering]='true'
            [pinning]='pinningConfig'
            [width]='"800px"'
            [height]='"500px"'
            [data]="data"
            [autoGenerate]="true">
        </igx-grid>
    `
})
export class GridRowPinningComponent {
    public data = SampleTestData.contactInfoDataFull();
    public pinningConfig: IPinningConfig = { columns: ColumnPinningPosition.Start, rows: RowPinningPosition.Top };

    @ViewChild(IgxGridComponent, { read: IgxGridComponent, static: true })
    public instance: IgxGridComponent;
}

@Component({
    template: `
    <igx-grid [data]="data" height="500px" [pinning]='pinningConfig'>
        <igx-column-layout *ngFor='let group of colGroups'>
            <igx-column *ngFor='let col of group.columns'
            [rowStart]="col.rowStart" [colStart]="col.colStart" [width]='col.width'
            [colEnd]="col.colEnd" [rowEnd]="col.rowEnd" [field]='col.field'></igx-column>
        </igx-column-layout>
    </igx-grid>
    `
})
export class GridRowPinningWithMRLComponent extends GridRowPinningComponent {
    cols: Array<any> = [
        { field: 'ID', rowStart: 1, colStart: 1 },
        { field: 'CompanyName', rowStart: 1, colStart: 2 },
        { field: 'ContactName', rowStart: 1, colStart: 3 },
        { field: 'ContactTitle', rowStart: 2, colStart: 1, rowEnd: 4, colEnd: 4 },
    ];
    colGroups = [
        {
            group: 'group1',
            columns: this.cols
        }
    ];
}

@Component({
    template: `
    <igx-grid
        [pinning]='pinningConfig'
        [width]='"800px"'
        [height]='"500px"'
        [data]="data"
        [autoGenerate]="true">
        <ng-template igxGridDetail let-dataItem>
            <div>
                <div><span class='categoryStyle'>Country:</span> {{dataItem.Country}}</div>
                <div><span class='categoryStyle'>City:</span> {{dataItem.City}}</div>
                <div><span class='categoryStyle'>Address:</span> {{dataItem.Address}}</div>
            </div>
        </ng-template>
</igx-grid>`
})
export class GridRowPinningWithMDVComponent extends GridRowPinningComponent {}


@Component({
    template: `
        <igx-grid
            [pinning]='pinningConfig'
            primaryKey='ID'
            [width]='"800px"'
            [height]='"500px"'
            [data]="data"
            [autoGenerate]="true">
        </igx-grid>
    `,
    providers: [{ provide: IgxGridTransaction, useClass: IgxTransactionService }]
})
export class GridRowPinningWithTransactionsComponent extends GridRowPinningComponent {}
