/* *
 *
 *  Popup generator for Stock tools
 *
 *  (c) 2009-2021 Sebastian Bochan
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

import type Annotation from '../Annotation';
import type AnnotationsOptions from '../AnnotationsOptions';
import type Chart from '../../../Core/Chart/Chart';
import type { HTMLDOMElement } from '../../../Core/Renderer/DOMElementType';

import AST from '../../../Core/Renderer/HTML/AST.js';
import H from '../../../Core/Globals.js';
const {
    doc,
    isFirefox
} = H;
import NavigationBindings from '../NavigationBindings.js';
import D from '../../../Core/DefaultOptions.js';
const { getOptions } = D;
import Pointer from '../../../Core/Pointer.js';
import PopupAnnotations from './PopupAnnotations.js';
import PopupIndicators from './PopupIndicators.js';
import PopupTabs from './PopupTabs.js';
import U from '../../../Core/Utilities.js';
const {
    addEvent,
    createElement,
    extend,
    fireEvent,
    pick,
    wrap
} = U;

/**
 * Internal types.
 * @private
 */
declare global {
    namespace Highcharts {
        interface IndicatorNameCouple {
            indicatorFullName: string;
            indicatorType: string;
        }
        interface PopupConfigObject {
            annotation: Annotation;
            formType: string;
            onSubmit: Function;
            options: AnnotationsOptions;
        }
        interface PopupFieldsDictionary<T> {
            [key: string]: (T | PopupFieldsDictionary<T>);
        }
        interface DropdownParameters {
            [key: string]: Array<string>;
        }
        interface PopupFieldsObject {
            actionType: string;
            fields: PopupFieldsDictionary<string>;
            linkedTo?: string;
            seriesId?: string;
            type?: string;
        }
        interface InputAttributes {
            value?: string;
            type?: string;
            htmlFor?: string;
            labelClassName?: string;
        }
    }
}

const indexFilter = /\d/g,
    PREFIX = 'highcharts-',
    DIV = 'div',
    INPUT = 'input',
    LABEL = 'label',
    BUTTON = 'button',
    SELECT = 'select',
    SPAN = 'span';

/* eslint-disable no-invalid-this, valid-jsdoc */

// onContainerMouseDown blocks internal popup events, due to e.preventDefault.
// Related issue #4606

wrap(
    Pointer.prototype,
    'onContainerMouseDown',
    function (this: Pointer, proceed: Function, e): void {
        // elements is not in popup
        if (!this.inClass(e.target, PREFIX + 'popup')) {
            proceed.apply(this, Array.prototype.slice.call(arguments, 1));
        }
    }
);

class Popup {

    /* *
     *
     *  Constructor
     *
     * */

    public constructor(
        parentDiv: HTMLDOMElement,
        iconsURL: string,
        chart?: Chart
    ) {
        this.chart = chart;
        this.iconsURL = iconsURL;
        this.lang = (getOptions().lang.navigation as any).popup;

        // create popup div
        this.container = createElement(
            DIV,
            {
                className: PREFIX + 'popup highcharts-no-tooltip'
            },
            void 0,
            parentDiv
        );

        addEvent(this.container, 'mousedown', (): void => {
            const activeAnnotation = chart &&
                chart.navigationBindings &&
                chart.navigationBindings.activeAnnotation;

            if (activeAnnotation) {
                activeAnnotation.cancelClick = true;

                const unbind = addEvent(H.doc, 'click', (): void => {
                    setTimeout((): void => {
                        activeAnnotation.cancelClick = false;
                    }, 0);
                    unbind();
                });
            }
        });

        // add close button
        this.addCloseBtn();
    }

    /* *
     *
     *  Properties
     *
     * */

    public chart?: Chart;
    public container: HTMLDOMElement;
    public formType?: string;
    public iconsURL: string;
    public lang: Record<string, string>;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Initialize the popup. Create base div and add close button.
     * @private
     * @param {Highcharts.HTMLDOMElement} parentDiv
     * Container where popup should be placed
     * @param {string} iconsURL
     * Icon URL
     */
    public init(
        parentDiv: HTMLDOMElement,
        iconsURL: string,
        chart?: Chart
    ): void {
        Popup.call(this, parentDiv, iconsURL, chart);
    }

    /**
     * Create HTML element and attach click event (close popup).
     * @private
     */
    public addCloseBtn(): void {
        let _self = this,
            closeBtn: HTMLDOMElement;

        const iconsURL = this.iconsURL;

        // create close popup btn
        closeBtn = createElement(
            DIV,
            {
                className: PREFIX + 'popup-close'
            },
            void 0,
            this.container
        );

        closeBtn.style['background-image' as any] = 'url(' +
                (
                    iconsURL.match(/png|svg|jpeg|jpg|gif/ig) ?
                        iconsURL : iconsURL + 'close.svg'
                ) + ')';

        ['click', 'touchstart'].forEach(function (eventName: string): void {
            addEvent(closeBtn, eventName, function (): void {
                if (_self.chart) {
                    fireEvent(_self.chart.navigationBindings, 'closePopup');
                } else {
                    _self.closePopup();
                }
            });
        });
    }

    /**
     * Create two columns (divs) in HTML.
     * @private
     * @param {Highcharts.HTMLDOMElement} container
     * Container of columns
     * @return {Highcharts.Dictionary<Highcharts.HTMLDOMElement>}
     * Reference to two HTML columns (lhsCol, rhsCol)
     */
    public addColsContainer(
        container: HTMLDOMElement
    ): Record<string, HTMLDOMElement> {
        let rhsCol,
            lhsCol;

        // left column
        lhsCol = createElement(
            DIV,
            {
                className: PREFIX + 'popup-lhs-col'
            },
            void 0,
            container
        );

        // right column
        rhsCol = createElement(
            DIV,
            {
                className: PREFIX + 'popup-rhs-col'
            },
            void 0,
            container
        );

        // wrapper content
        createElement(
            DIV,
            {
                className: PREFIX + 'popup-rhs-col-wrapper'
            },
            void 0,
            rhsCol
        );

        return {
            lhsCol: lhsCol,
            rhsCol: rhsCol
        };
    }

    /**
     * Create input with label.
     *
     * @private
     *
     * @param {string} option
     *        Chain of fields i.e params.styles.fontSize separeted by the dot.
     *
     * @param {string} indicatorType
     *        Type of the indicator i.e. sma, ema...
     *
     * @param {HTMLDOMElement} parentDiv
     *        HTML parent element.
     *
     * @param {Highcharts.InputAttributes} inputAttributes
     *        Attributes of the input.
     *
     * @return {HTMLInputElement}
     *         Return created input element.
     */
    public addInput(
        option: string,
        indicatorType: string,
        parentDiv: HTMLDOMElement,
        inputAttributes: Highcharts.InputAttributes
    ): HTMLDOMElement {
        const optionParamList = option.split('.'),
            optionName = optionParamList[optionParamList.length - 1],
            lang = this.lang,
            inputName = PREFIX + indicatorType + '-' + pick(
                inputAttributes.htmlFor,
                optionName
            );
        let input;

        if (!inputName.match(indexFilter)) {
            // add label
            createElement(
                LABEL,
                {
                    htmlFor: inputName,
                    className: inputAttributes.labelClassName
                },
                void 0,
                parentDiv
            ).appendChild(
                doc.createTextNode(lang[optionName] || optionName)
            );
        }

        // add input
        input = createElement(
            INPUT,
            {
                name: inputName,
                value: inputAttributes.value,
                type: inputAttributes.type,
                className: PREFIX + 'popup-field'
            },
            void 0,
            parentDiv
        );
        input.setAttribute(PREFIX + 'data-name', option);
        return input;
    }

    /**
     * Create button.
     * @private
     * @param {Highcharts.HTMLDOMElement} parentDiv
     * Container where elements should be added
     * @param {string} label
     * Text placed as button label
     * @param {string} type
     * add | edit | remove
     * @param {Function} callback
     * On click callback
     * @param {Highcharts.HTMLDOMElement} fieldsDiv
     * Container where inputs are generated
     * @return {Highcharts.HTMLDOMElement}
     * HTML button
     */
    public addButton(
        parentDiv: HTMLDOMElement,
        label: string,
        type: string,
        fieldsDiv: HTMLDOMElement,
        callback?: Function
    ): HTMLDOMElement {
        let _self = this,
            closePopup = this.closePopup,
            getFields = this.getFields,
            button: HTMLDOMElement;

        button = createElement(BUTTON, void 0, void 0, parentDiv);
        button.appendChild(doc.createTextNode(label));

        if (callback) {
            ['click', 'touchstart'].forEach(function (eventName: string): void {
                addEvent(button, eventName, function (): void {
                    closePopup.call(_self);

                    return callback(
                        getFields(fieldsDiv, type)
                    );
                });
            });
        }

        return button;
    }

    /**
     * Get values from all inputs and selections then create JSON.
     *
     * @private
     *
     * @param {Highcharts.HTMLDOMElement} parentDiv
     * The container where inputs and selections are created.
     *
     * @param {string} type
     * Type of the popup bookmark (add|edit|remove).
     */
    public getFields(
        parentDiv: HTMLDOMElement,
        type: string
    ): Highcharts.PopupFieldsObject {
        const inputList = Array.prototype.slice.call(
                parentDiv.querySelectorAll(INPUT)
            ),
            selectList = Array.prototype.slice.call(
                parentDiv.querySelectorAll(SELECT)
            ),
            optionSeries = '#' + PREFIX + 'select-series > option:checked',
            optionVolume = '#' + PREFIX + 'select-volume > option:checked',
            linkedTo = parentDiv.querySelectorAll(optionSeries)[0],
            volumeTo = parentDiv.querySelectorAll(optionVolume)[0];
        let fieldsOutput: Highcharts.PopupFieldsObject;

        fieldsOutput = {
            actionType: type,
            linkedTo: linkedTo && linkedTo.getAttribute('value') || '',
            fields: { }
        };

        inputList.forEach(function (input: HTMLInputElement): void {
            const param = input.getAttribute(PREFIX + 'data-name'),
                seriesId = input.getAttribute(PREFIX + 'data-series-id');

            // params
            if (seriesId) {
                fieldsOutput.seriesId = input.value;
            } else if (param) {
                fieldsOutput.fields[param] = input.value;
            } else {
                // type like sma / ema
                fieldsOutput.type = input.value;
            }
        });

        selectList.forEach(function (select: HTMLInputElement): void {
            const id = select.id;

            // Get inputs only for the parameters, not for series and volume.
            if (
                id !== PREFIX + 'select-series' &&
                id !== PREFIX + 'select-volume'
            ) {
                const parameter = id.split('highcharts-select-')[1];

                fieldsOutput.fields[parameter] = select.value;
            }
        });

        if (volumeTo) {
            fieldsOutput.fields['params.volumeSeriesID'] = volumeTo
                .getAttribute('value') || '';
        }

        return fieldsOutput;
    }

    /**
     * Reset content of the current popup and show.
     * @private
     */
    public showPopup(): void {

        const popupDiv = this.container,
            toolbarClass = PREFIX + 'annotation-toolbar',
            popupCloseBtn = popupDiv
                .querySelectorAll('.' + PREFIX + 'popup-close')[0];

        this.formType = void 0;

        // reset content
        popupDiv.innerHTML = AST.emptyHTML;

        // reset toolbar styles if exists
        if (popupDiv.className.indexOf(toolbarClass) >= 0) {
            popupDiv.classList.remove(toolbarClass);

            // reset toolbar inline styles
            popupDiv.removeAttribute('style');
        }

        // add close button
        popupDiv.appendChild(popupCloseBtn);
        popupDiv.style.display = 'block';
        popupDiv.style.height = '';
    }

    /**
     * Hide popup.
     * @private
     */
    public closePopup(): void {
        this.container.style.display = 'none';
    }

    /**
     * Create content and show popup.
     * @private
     * @param {string} - type of popup i.e indicators
     * @param {Highcharts.Chart} - chart
     * @param {Highcharts.AnnotationsOptions} - options
     * @param {Function} - on click callback
     */
    public showForm(
        type: string,
        chart: Highcharts.AnnotationChart,
        options: AnnotationsOptions,
        callback: Function
    ): void {

        if (!chart) {
            return;
        }

        // show blank popup
        this.showPopup();

        // indicator form
        if (type === 'indicators') {
            this.indicators.addForm.call(this, chart, options, callback);
        }

        // annotation small toolbar
        if (type === 'annotation-toolbar') {
            this.annotations.addToolbar.call(this, chart, options, callback);
        }

        // annotation edit form
        if (type === 'annotation-edit') {
            this.annotations.addForm.call(this, chart, options, callback);
        }

        // flags form - add / edit
        if (type === 'flag') {
            this.annotations.addForm.call(this, chart, options, callback, true);
        }

        this.formType = type;

        // Explicit height is needed to make inner elements scrollable
        this.container.style.height = this.container.offsetHeight + 'px';
    }
}

/* *
 *
 *  Class Prototype
 *
 * */

interface Popup {
    readonly annotations: typeof PopupAnnotations;
    readonly indicators: typeof PopupIndicators;
    readonly tabs: typeof PopupTabs;
}

extend(Popup.prototype, {
    annotations: PopupAnnotations,
    indicators: PopupIndicators,
    tabs: PopupTabs
});

addEvent(NavigationBindings, 'showPopup', function (
    this: NavigationBindings,
    config: Highcharts.PopupConfigObject
): void {
    if (!this.popup) {
        // Add popup to main container
        this.popup = new Popup(
            this.chart.container, (
                this.chart.options.navigation.iconsURL ||
                (
                    this.chart.options.stockTools &&
                    this.chart.options.stockTools.gui.iconsURL
                ) ||
                'https://code.highcharts.com/@product.version@/gfx/stock-icons/'
            ), this.chart
        );
    }

    this.popup.showForm(
        config.formType,
        this.chart,
        config.options,
        config.onSubmit
    );
});

addEvent(
    NavigationBindings,
    'closePopup',
    function (this: NavigationBindings): void {
        if (this.popup) {
            this.popup.closePopup();
        }
    }
);

/* *
 *
 *  Default Export
 *
 * */

export default Popup;