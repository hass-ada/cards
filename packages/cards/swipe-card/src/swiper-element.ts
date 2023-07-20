// @ts-expect-error Wrongly typed as an interface
import { SwiperContainer as ActualSwiperContainer, SwiperSlide as ActualSwiperSlide } from 'swiper/element'

// @ts-expect-error Wrongly typed as an interface
export const SwiperContainer = ActualSwiperContainer as HTMLElement & ActualSwiperContainer
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type SwiperContainer = HTMLElement & ActualSwiperContainer
// @ts-expect-error Wrongly typed as an interface
export const SwiperSlide = ActualSwiperSlide as HTMLElement & ActualSwiperSlide
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type SwiperSlide = HTMLElement & ActualSwiperSlide
