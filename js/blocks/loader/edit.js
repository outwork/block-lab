import inspectorControls from './inspector'
import inspectorAdvancedControls from './advanced'
import controls from '../controls';
import { simplifiedFields } from "./fields";
import icons from '../../../assets/icons.json';

const { ServerSideRender } = wp.editor;
const { applyFilters } = wp.hooks;

const formControls = ( props, block ) => {
	return (
		<div key={ block.name + "-fields" }>
			<Fields
				fields={ block.fields }
				parentBlockProps={ props }
				parentBlock={ block }
			/>
		</div>
	)
};

/**
 * Gets the rendered control, based on the field values.
 *
 * @param {Object}        parentBlock      The block that has the control.
 * @param {Object}        parentBlockProps The block props.
 * @param {Object}        field            The field to render.
 * @param {number|string} index            The index in the block, or the row name if one exists.
 * @return {Function|null} The rendered control as JSX, or null.
 */
const RenderedControl = ( { parentBlock, parentBlockProps, field } ) => {
	if ( field.location && ! field.location.includes( 'editor' ) ) {
		return null; // This is not meant for the editor.
	}

	const controlFunction = getControlFunction( field );
	const control = controlFunction ? controlFunction( parentBlockProps, field, parentBlock ) : null;

	return (
		<div key={ `${ field.name }-control` }>
			{ control }
		</div>
	)
};

/**
 * Gets the control function for the field.
 *
 * @param {Object} field The field to get the control function of.
 * @return {Function} The control function.
 */
const getControlFunction = ( field ) => {
	if ( field.hasOwnProperty( 'controlFunction' ) ) {
		return field.controlFunction;
	}

	const loadedControls = applyFilters( 'block_lab_controls', controls );
	return loadedControls[ field.control ];
};

/**
 * Renders the fields, using their control functions.
 *
 * @param {Array}  fields           The fields to render.
 * @param {Object} parentBlockProps The props to pass to the control function.
 * @param {Object} parentBlock      The block where the fields are.
 * @param {String} rowName          The name of the repeater row, if this field is in one (optional).
 * @return {Function} fields The rendered fields.
 */
export const Fields = ( { fields, parentBlockProps, parentBlock, rowName = null } ) => {
	return simplifiedFields( fields, rowName ).map( ( field, index ) => {
		return (
			<RenderedControl
				parentBlock={ parentBlock }
				parentBlockProps={ parentBlockProps }
				field={ field }
				index={ index }
				key={ field.name }
			/>
		);
	} );
};

/**
 * Gets the parent from fields, if one exists.
 *
 * Sub-fields in the Repeater control have parents.
 * This looks for a parent in each field, and returns a parent as long as they don't have different parents.
 *
 * @param {Object} fields The fields in which to look for the parent.
 * @return {String|null} parent The parent of the fields.
 */
export const getParent = ( fields ) => {
	let parent = null;
	for ( const field in fields ) {
		if ( fields.hasOwnProperty( field ) ) {
			if ( parent && parent !== fields[ field ].parent ) {
				return null;
			}
			parent = fields[ field ].parent;
		}
	}

	return parent;
};

export const editComponent = ( props, block ) => {
	const { className, isSelected } = props;

	if ( 'undefined' === typeof icons[block.icon] ) {
		icons[block.icon] = ''
	}

	return [
		inspectorControls( props, block ),
		inspectorAdvancedControls( props, block ),
		(
			<div className={className} key={"form-controls-" + block.name}>
				{isSelected ? (
					<div className="block-form">
						<h3 dangerouslySetInnerHTML={{ __html: icons[block.icon] + ' ' + block.title }} />
						<div>
							{formControls( props, block )}
						</div>
					</div>
				) : (
					<ServerSideRender
						block={'block-lab/' + block.name}
						attributes={props.attributes}
					/>
				)}
			</div>
		),
	]
};
