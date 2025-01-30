import { cn } from '~/utils/cn'
import type { SvgIconProps } from '../svg-icon'
import { SvgIcon } from '../svg-icon'

export function DataAvailabilityIcon({ className, ...props }: SvgIconProps) {
  return (
    <SvgIcon
      width="20"
      height="20"
      viewBox="0 0 20 20"
      aria-label="Data Availability icon"
      className={cn('fill-primary', className)}
      {...props}
    >
      <path d="M3.51848 1.66699C2.50638 1.66699 1.66663 2.50675 1.66663 3.51884V5.3707C1.66663 6.38279 2.50638 7.22255 3.51848 7.22255H5.37033C6.38242 7.22255 7.22218 6.38279 7.22218 5.3707V3.51884C7.22218 2.50675 6.38242 1.66699 5.37033 1.66699H3.51848ZM14.6296 1.66699C13.6175 1.66699 12.7777 2.50675 12.7777 3.51884V5.3707C12.7777 6.38279 13.6175 7.22255 14.6296 7.22255H16.4814C17.4935 7.22255 18.3333 6.38279 18.3333 5.3707V3.51884C18.3333 2.50675 17.4935 1.66699 16.4814 1.66699H14.6296ZM3.51848 3.51884H5.37033V5.3707H3.51848V3.51884ZM9.07403 3.51884V5.3707H10.9259V3.51884H9.07403ZM14.6296 3.51884H16.4814V5.3707H14.6296V3.51884ZM3.51848 9.0744V10.9263H5.37033V9.0744H3.51848ZM14.6296 9.0744V10.9263H16.4814V9.0744H14.6296ZM3.51848 12.7781C2.50638 12.7781 1.66663 13.6179 1.66663 14.63V16.4818C1.66663 17.4939 2.50638 18.3337 3.51848 18.3337H5.37033C6.38242 18.3337 7.22218 17.4939 7.22218 16.4818V14.63C7.22218 13.6179 6.38242 12.7781 5.37033 12.7781H3.51848ZM14.6296 12.7781C13.6175 12.7781 12.7777 13.6179 12.7777 14.63V16.4818C12.7777 17.4939 13.6175 18.3337 14.6296 18.3337H16.4814C17.4935 18.3337 18.3333 17.4939 18.3333 16.4818V14.63C18.3333 13.6179 17.4935 12.7781 16.4814 12.7781H14.6296ZM3.51848 14.63H5.37033V16.4818H3.51848V14.63ZM9.07403 14.63V16.4818H10.9259V14.63H9.07403ZM14.6296 14.63H16.4814V16.4818H14.6296V14.63Z" />
    </SvgIcon>
  )
}
