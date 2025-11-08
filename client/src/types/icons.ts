import type { ForwardRefExoticComponent, RefAttributes } from 'react';

type SvgProps = Omit<React.SVGProps<SVGSVGElement>, 'ref'> & {
  title?: string;
  titleId?: string;
};

export type HeroIcon = ForwardRefExoticComponent<SvgProps & RefAttributes<SVGSVGElement>>;
