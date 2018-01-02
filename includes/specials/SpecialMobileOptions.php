<?php

/**
 * Adds a special page with mobile specific preferences
 */
class SpecialMobileOptions extends MobileSpecialPage {
	/** @var Title The title of page to return to after save */
	private $returnToTitle;
	/** @var boolean $hasDesktopVersion Whether this special page has a desktop version or not */
	protected $hasDesktopVersion = true;
	/** @var array $options Used in the execute() function as a map of subpages to
	 functions that are executed when the request method is defined. */
	private $options = [
		'Language' => [ 'get' => 'chooseLanguage' ],
	];

	/**
	 * Construct function
	 */
	public function __construct() {
		parent::__construct( 'MobileOptions' );
	}

	/**
	 * @return bool
	 */
	public function doesWrites() {
		return true;
	}

	/**
	 * Render the special page
	 * @param string|null $par Parameter submitted as subpage
	 */
	public function execute( $par = '' ) {
		parent::execute( $par );
		$context = MobileContext::singleton();

		$this->returnToTitle = Title::newFromText( $this->getRequest()->getText( 'returnto' ) );
		if ( !$this->returnToTitle ) {
			$this->returnToTitle = Title::newMainPage();
		}

		$this->setHeaders();
		$context->setForceMobileView( true );
		$context->setContentTransformations( false );
		// check, if the subpage has a registered function, that needs to be executed
		if ( isset( $this->options[$par] ) ) {
			$option = $this->options[$par];

			// select the correct function for the given request method (post, get)
			if ( $this->getRequest()->wasPosted() && isset( $option['post'] ) ) {
				$func = $option['post'];
			} else {
				$func = $option['get'];
			}
			// run the function
			$this->$func();
		} else {
			if ( $this->getRequest()->wasPosted() ) {
				$this->submitSettingsForm();
			} else {
				$this->addSettingsForm();
			}
		}
	}

	/**
	 * Render the settings form (with actual set settings) and add it to the
	 * output as well as any supporting modules.
	 */
	private function addSettingsForm() {
		$out = $this->getOutput();
		$context = MobileContext::singleton();
		$user = $this->getUser();

		$out->setPageTitle( $this->msg( 'mobile-frontend-main-menu-settings-heading' ) );
		$out->enableOOUI();

		if ( $this->getRequest()->getCheck( 'success' ) ) {
			$out->wrapWikiMsg(
				MobileUI::contentElement(
					Html::successBox( $this->msg( 'savedprefs' ) )
				)
			);
		}

		$fields = [];
		$form = new OOUI\FormLayout( [
			'method' => 'POST',
			'id' => 'mobile-options',
			'action' => $this->getPageTitle()->getLocalURL(),
		] );
		$form->addClasses( [ 'mw-mf-settings' ] );

		// beta settings
		if ( $this->getMFConfig()->get( 'MFEnableBeta' ) ) {
			$input = new OOUI\CheckboxInputWidget( [
				'name' => 'enableBeta',
				'infusable' => true,
				'selected' => $context->isBetaGroupMember(),
				'id' => 'enable-beta-toggle',
				'value' => '1',
			] );
			$fields[] = new OOUI\FieldLayout(
				$input,
				[
				'label' => new OOUI\LabelWidget( [
					'input' => $input,
					'label' => new OOUI\HtmlSnippet(
						Html::openElement( 'div' ) .
						Html::element( 'strong', [],
							$this->msg( 'mobile-frontend-settings-beta' )->parse() ) .
						Html::element( 'div', [ 'class' => 'option-description' ],
							$this->msg( 'mobile-frontend-opt-in-explain' )->parse()
						) .
						Html::closeElement( 'div' )
					)
				] ),
				'id' => 'beta-field',
			] );
		}

		$fields[] = new OOUI\ButtonInputWidget( [
			'id' => 'mw-mf-settings-save',
			'infusable' => true,
			'value' => $this->msg( 'mobile-frontend-save-settings' )->escaped(),
			'label' => $this->msg( 'mobile-frontend-save-settings' )->escaped(),
			'flags' => [ 'primary', 'progressive' ],
			'type' => 'submit',
		] );

		if ( $user->isLoggedIn() ) {
			$fields[] = new OOUI\HiddenInputWidget( [ 'name' => 'token',
				'value' => $user->getEditToken() ] );
		}

		// @codingStandardsIgnoreEnd
		$form->appendContent(
			$fields
		);
		$out->addHTML( $form );
	}

	/**
	 * Get a list of languages available for this project
	 * @return string parsed Html
	 */
	private function getSiteSelector() {
		$selector = '';
		$count = 0;
		$language = $this->getLanguage();
		$interwikiLookup = \MediaWiki\MediaWikiServices::getInstance()->getInterwikiLookup();
		foreach ( $interwikiLookup->getAllPrefixes( true ) as $interwiki ) {
			$code = $interwiki['iw_prefix'];
			$name = Language::fetchLanguageName( $code, $language->getCode() );
			if ( !$name ) {
				continue;
			}
			$title = Title::newFromText( "$code:" );
			if ( $title ) {
				$url = $title->getFullURL();
			} else {
				$url = '';
			}
			$attrs = [ 'href' => $url ];
			$count++;
			if ( $code == $this->getConfig()->get( 'LanguageCode' ) ) {
				$attrs['class'] = 'selected';
			}
			$selector .= Html::openElement( 'li' );
			$selector .= Html::element( 'a', $attrs, $name );
			$selector .= Html::closeElement( 'li' );
		}

		if ( $selector && $count > 1 ) {
			$selector = <<<HTML
			<p>{$this->msg( 'mobile-frontend-settings-site-description', $count )->parse()}</p>
			<ul id='mw-mf-language-list'>
				{$selector}
			</ul>
HTML;
		}

		return $selector;
	}

	/**
	 * Render the language selector special page, callable through Special:MobileOptions/Language
	 * See the $options member variable of this class.
	 */
	private function chooseLanguage() {
		$out = $this->getOutput();
		$out->setPageTitle( $this->msg( 'mobile-frontend-settings-site-header' )->escaped() );
		$out->addHTML( $this->getSiteSelector() );
	}

	/**
	 * Saves the settings submitted by the settings form
	 */
	private function submitSettingsForm() {
		$schema = 'MobileOptionsTracking';
		$schemaRevision = 16934032;
		$schemaData = [
			'action' => 'success',
			'beta' => "nochange",
		];
		$context = MobileContext::singleton();
		$request = $this->getRequest();
		$user = $this->getUser();

		if ( $user->isLoggedIn() && !$user->matchEditToken( $request->getVal( 'token' ) ) ) {
			$errorText = __METHOD__ . '(): token mismatch';
			wfDebugLog( 'mobile', $errorText );
			$this->getOutput()->addHTML( '<div class="error">'
				. $this->msg( "mobile-frontend-save-error" )->parse()
				. '</div>'
			);
			$schemaData['action'] = 'error';
			$schemaData['errorText'] = $errorText;
			ExtMobileFrontend::eventLog( $schema, $schemaRevision, $schemaData );
			$this->addSettingsForm();
			return;
		}

		if ( $request->getBool( 'enableBeta' ) ) {
			$group = 'beta';
			if ( !$context->isBetaGroupMember() ) {
				// The request was to turn on beta
				$schemaData['beta'] = "on";
			}
		} else {
			$group = '';
			if ( $context->isBetaGroupMember() ) {
				// beta was turned off
				$schemaData['beta'] = "off";
			}
		}
		$context->setMobileMode( $group );
		$url = $this->getPageTitle()->getFullURL( 'success' );
		$context->getOutput()->redirect( MobileContext::singleton()->getMobileUrl( $url ) );
	}

	/**
	 * @return string[]
	 */
	public function getSubpagesForPrefixSearch() {
		return array_keys( $this->options );
	}
}
