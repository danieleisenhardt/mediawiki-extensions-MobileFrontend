<?php
namespace MobileFrontend\Features;

/**
 * Class Feature
 * @package MobileFrontend\Features
 */
class Feature implements IFeature {

	const DEFAULT_ENABLED_MODE = false;
	/**
	 * @var string
	 */
	private $name;
	/**
	 * Feature group (mobile-frontend, minerva, ...)
	 * @var string
	 */
	private $group;
	/**
	 * @var array
	 */
	private $options;

	/**
	 * Feature constructor.
	 * @param string $name feature name (used as an ID)
	 * @param string $group feature group (used as a translation prefix)
	 * @param array $options Feature options
	 */
	public function __construct( $name, $group = 'mobile-frontend', $options = [] ) {
		$this->name = $name;
		$this->group = $group;
		$this->options = $options;
	}

	/**
	 * @inheritDoc
	 */
	public function __toString() {
		return $this->name;
	}

	/**
	 * @inheritDoc
	 */
	public function isAvailable( $mode ) {
		return array_key_exists( $mode, $this->options ) ?
			$this->options[ $mode ] : self::DEFAULT_ENABLED_MODE;
	}

	/**
	 * @inheritDoc
	 */
	public function getId() {
		return $this->name;
	}

	/**
	 * @inheritDoc
	 */
	public function getGroup() {
		return $this->group;
	}
	/**
	 * @inheritDoc
	 */
	public function getNameKey() {
		return $this->group . '-mobile-option-' . $this->name;
	}

	/**
	 * @inheritDoc
	 */
	public function getDescriptionKey() {
		return $this->group . '-mobile-option-' . $this->name . '-description';
	}

}
