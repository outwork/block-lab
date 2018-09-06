/**
 * Used for editing Blocks.
 *
 * @package   Block_Lab
 * @copyright Copyright(c) 2018, Block Lab
 * @license http://opensource.org/licenses/GPL-2.0 GNU General Public License, version 2 (GPL-2.0)
 *
 * Globals wp, blockLab
 */

(function( $ ) {

	$(function() {
		blockCategoryInit();
		blockIconInit();
		blockFieldInit();

		$( '#title' ).on( 'change keyup', function() {
			let slug = slugify( $( this ).val() );
			$( '#block-properties-slug' ).val( slug );
		});

		$( '#block-add-field' ).on( 'click', function() {
			let template = wp.template( 'field-repeater' ),
				data     = { uid: new Date().getTime() },
				field    = $( template( data ) );
			$( '.block-fields-rows' ).append( field );
			$( '.block-no-fields' ).hide();
			field.find( '.block-fields-actions-edit' ).trigger( 'click' );
		});

		$( '#block_properties .block-properties-icons span' ).on( 'click', function() {
			$( '#block_properties .block-properties-icons span.selected' ).removeClass( 'selected' );
			$( this ).addClass( 'selected' );
			$( '#block-properties-icon' ).val( $( this ).data( 'value' ) );
		});

		$( '.block-fields-rows' )
			.on( 'click', '.block-fields-actions-delete', function() {
				$( this ).closest( '.block-fields-row' ).remove();
				if ( 0 === $( '.block-fields-rows' ).children( '.block-fields-row' ).length ) {
					$( '.block-no-fields' ).show();
				}
			})
			.on( 'click', '.block-fields-actions-edit, a.row-title', function() {
				$( this ).closest( '.block-fields-row' ).toggleClass( 'block-fields-row-active' );
				$( this ).closest( '.block-fields-row' ).find( '.block-fields-edit' ).slideToggle();

				// Fetch field settings if field is active and there are no settings.
				if ( $( this ).closest( '.block-fields-row' ).hasClass( 'block-fields-row-active' ) ) {
					let fieldRow = $( this ).closest( '.block-fields-row' );
					if ( 0 === fieldRow.find( '.block-fields-edit-settings' ).length ) {
						let fieldControl = fieldRow.find( '.block-fields-edit-control select' ).val();
						fetchFieldSettings( fieldRow, fieldControl );
					}
				}
			})
			.on( 'click', '.block-fields-edit-actions-close a.button', function() {
				$( this ).closest( '.block-fields-row' ).removeClass( 'block-fields-row-active' );
				$( this ).closest( '.block-fields-edit' ).slideUp();
			})
			.on( 'change keyup', '.block-fields-edit input, .block-fields-edit select', function() {
				let sync = $( this ).data( 'sync' );
				$( '#' + sync ).text( $( this ).val() );
			})
			.on( 'change', '.block-fields-edit-control select', function() {
				let fieldRow = $( this ).closest( '.block-fields-row' );
				fetchFieldSettings( fieldRow, $( this ).val() );
			})
			.on( 'change keyup', '.block-fields-edit-label input', function() {
				let slug = slugify( $( this ).val() );
				$( this )
					.closest( '.block-fields-edit' )
					.find( '.block-fields-edit-name input' )
					.val( slug )
					.trigger( 'change' );
			})
			.sortable({
				axis: 'y',
				cursor: 'grabbing',
				handle: '.block-fields-sort-handle',
				containment: 'parent',
				tolerance: 'pointer'
			});
	});

	let blockCategoryInit = function() {
		let categories       = wp.blocks.getCategories(),
			categoriesLength = categories.length,
			category         = $( '#block-properties-category-saved' );

		for (let i = 0; i < categoriesLength; i++) {
			if ( 'reusable' === categories[i].slug ) {
				continue;
			}
			$( '<option/>', {
				value: categories[i].slug,
				text: categories[i].title,
			} ).appendTo( '#block-properties-category' );
		}

		if ( category.val() !== '' ) {
			let option = $( '#block-properties-category option[value="' + category.val() + '"]' );
			if ( option.length > 0 ) {
				$( '#block-properties-category' ).prop( 'selectedIndex', option.index() );
			}
		}
	};

	let blockIconInit = function() {
		let iconsContainer = $( '.block-properties-icons' ),
			selectedIcon   = $( '.selected', iconsContainer );
		if ( 0 !== iconsContainer.length && 0 !== selectedIcon.length ) {
			iconsContainer.scrollTop( selectedIcon.position().top );
		}
	}

	let blockFieldInit = function() {
		if ( 0 === $( '.block-fields-rows' ).children( '.block-fields-row' ).length ) {
			$( '.block-no-fields' ).show();
		}
	};

	let fetchFieldSettings = function( fieldRow, fieldControl ) {
		if ( ! blockLab.hasOwnProperty( 'fieldSettingsNonce' ) ) {
			return;
		}

		let loadingRow = '' +
			'<tr class="block-fields-edit-loading">' +
			'   <td class="spacer"></td>' +
			'   <th></th>' +
			'   <td><span class="loading"></span></td>' +
			'</tr>';

		$( '.block-fields-edit-settings', fieldRow ).remove();
		$( '.block-fields-edit-control', fieldRow ).after( $( loadingRow ) );

		wp.ajax.send( 'fetch_field_settings', {
			success: function( data ) {
				$( '.block-fields-edit-loading', fieldRow ).remove();

				if ( ! data.hasOwnProperty( 'html' ) ) {
					return;
				}
				let settingsRows = $( data.html );
				$( '.block-fields-edit-control', fieldRow ).after( settingsRows );
			},
			error: function() {
				$( '.block-fields-edit-loading', fieldRow ).remove();
			},
			data: {
				control: fieldControl,
				uid:     fieldRow.data( 'uid' ),
				nonce:   blockLab.fieldSettingsNonce
			}
		});
	};

	let slugify = function( text ) {
		return text
			.toLowerCase()
			.replace( /[^\w ]+/g,'' )
			.replace( / +/g,'-' )
			.replace( /_+/g,'-' );
	};

})( jQuery );
