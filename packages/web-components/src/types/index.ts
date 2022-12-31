
declare module 'preact' {
  namespace JSX {
      interface IntrinsicElements {
        "j-component": JComponentProps;
				"j-avatar": JAvatarProps;
				"j-badge": JBadgeProps;
				"j-box": JBoxProps;
				"j-button": JButtonProps;
				"j-carousel": JCarouselProps;
				"j-checkbox": JCheckboxProps;
				"j-flex": JFlexProps;
				"j-icon": JIconProps;
				"j-input": JInputProps;
				"j-menu-group-item": JMenuGroupItemProps;
				"j-menu-item": JMenuItemProps;
				"j-menu": JMenuProps;
				"j-modal": JModalProps;
				"j-popover": JPopoverProps;
				"j-radio-button": JRadioButtonProps;
				"j-select": JSelectProps;
				"j-skeleton": JSkeletonProps;
				"j-spinner": JSpinnerProps;
				"j-tab-item": JTabItemProps;
				"j-tabs": JTabsProps;
				"j-text": JTextProps;
				"j-timestamp": JTimestampProps;
				"j-toast": JToastProps;
				"j-toggle": JToggleProps;
				"j-tooltip": JTooltipProps;

      }
  }

  
type JComponentProps = {
  variant?: string;
	children: any
}
  

type JAvatarProps = {
  src?: string;
	hash?: string;
	selected?: string;
	online?: string;
	initials?: string;
	icon?: string;
	size?: string;
	children: any
}
  

type JBadgeProps = {
  variant?: string;
	size?: string;
	children: any
}
  

type JBoxProps = {
  p?: string;
	pl?: string;
	pr?: string;
	pt?: string;
	pb?: string;
	px?: string;
	py?: string;
	m?: string;
	ml?: string;
	mr?: string;
	mt?: string;
	mb?: string;
	mx?: string;
	my?: string;
	bg?: string;
	children: any
}
  

type JButtonProps = {
  variant?: string;
	size?: string;
	disabled?: string;
	loading?: string;
	square?: string;
	full?: string;
	circle?: string;
	children: any
}
  

type JCarouselProps = {
  gap?: string;
	children: any
}
  

type JCheckboxProps = {
  checked?: string;
	full?: string;
	disabled?: string;
	size?: string;
	value?: string;
	children: any
}
  

type JFlexProps = {
  j?: string;
	a?: string;
	wrap?: string;
	gap?: string;
	direction?: string;
	children: any
}
  

type JIconProps = {
  name?: string;
	size?: string;
	color?: string;
	children: any
}
  

type JInputProps = {
  value?: string;
	max?: string;
	min?: string;
	maxlength?: string;
	minlength?: string;
	pattern?: string;
	label?: string;
	name?: string;
	size?: string;
	list?: string;
	step?: string;
	placeholder?: string;
	errortext?: string;
	helptext?: string;
	autocomplete?: string;
	autovalidate?: string;
	autofocus?: string;
	disabled?: string;
	full?: string;
	error?: string;
	required?: string;
	readonly?: string;
	type?: string;
	children: any
}
  

type JMenuGroupItemProps = {
  collapsible?: string;
	open?: string;
	title?: string;
	children: any
}
  

type JMenuItemProps = {
  selected?: string;
	active?: string;
	children: any
}
  

type JMenuProps = {
  children: any
}
  

type JModalProps = {
  size?: string;
	open?: string;
	children: any
}
  

type JPopoverProps = {
  open?: string;
	placement?: string;
	event?: string;
	children: any
}
  

type JRadioButtonProps = {
  checked?: string;
	value?: string;
	name?: string;
	size?: string;
	full?: string;
	disabled?: string;
	children: any
}
  

type JSelectProps = {
  value?: string;
	label?: string;
	open?: string;
	inputValue?: string;
	children: any
}
  

type JSkeletonProps = {
  variant?: string;
	height?: string;
	width?: string;
	children: any
}
  

type JSpinnerProps = {
  size?: string;
	children: any
}
  

type JTabItemProps = {
  checked?: string;
	disabled?: string;
	size?: string;
	variant?: string;
	children: any
}
  

type JTabsProps = {
  value?: string;
	vertical?: string;
	full?: string;
	children: any
}
  

type JTextProps = {
  size?: string;
	variant?: string;
	tag?: string;
	nomargin?: string;
	inline?: string;
	uppercase?: string;
	color?: string;
	weight?: string;
	children: any
}
  

type JTimestampProps = {
  value?: string;
	locales?: string;
	relative?: string;
	dateStyle?: string;
	timeStyle?: string;
	dayPeriod?: string;
	hourCycle?: string;
	timeZone?: string;
	weekday?: string;
	era?: string;
	year?: string;
	month?: string;
	day?: string;
	hour?: string;
	minute?: string;
	second?: string;
	children: any
}
  

type JToastProps = {
  variant?: string;
	open?: string;
	autohide?: string;
	children: any
}
  

type JToggleProps = {
  checked?: string;
	full?: string;
	disabled?: string;
	size?: string;
	value?: string;
	children: any
}
  

type JTooltipProps = {
  open?: string;
	title?: string;
	placement?: string;
	children: any
}
  
}
