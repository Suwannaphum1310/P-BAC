import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "p-4 bg-white rounded-xl border-2 border-[hsl(0,100%,20%)] shadow-xl",
        className
      )}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center mb-2",
        caption_label: "text-base font-bold text-[hsl(0,100%,20%)]",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-[hsl(0,100%,20%)]/10 p-0 hover:bg-[hsl(0,100%,20%)] hover:text-white border-[hsl(0,100%,20%)]/30 transition-all duration-200",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse",
        head_row: "flex",
        head_cell: "text-[hsl(0,100%,20%)] rounded-md w-10 font-bold text-xs uppercase",
        row: "flex w-full mt-1",
        cell: cn(
          "h-10 w-10 text-center text-sm p-0 relative rounded-lg",
          "[&:has([aria-selected])]:bg-[hsl(0,100%,20%)]/10",
          "focus-within:relative focus-within:z-20"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 p-0 font-medium hover:bg-[hsl(0,100%,20%)]/20 hover:text-[hsl(0,100%,20%)] transition-all duration-200 rounded-lg"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "!bg-[hsl(0,100%,20%)] !text-white hover:!bg-[hsl(0,100%,25%)] hover:!text-white focus:!bg-[hsl(0,100%,20%)] focus:!text-white font-bold shadow-lg",
        day_today: "bg-[hsl(51,100%,50%)] text-[hsl(0,100%,20%)] font-bold ring-2 ring-[hsl(0,100%,20%)]/30",
        day_outside:
          "day-outside text-gray-300 opacity-50 aria-selected:bg-[hsl(0,100%,20%)]/30 aria-selected:text-gray-400",
        day_disabled: "text-gray-300 opacity-30",
        day_range_middle: "aria-selected:bg-[hsl(0,100%,20%)]/10 aria-selected:text-[hsl(0,100%,20%)]",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-5 w-5 text-[hsl(0,100%,20%)]" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-5 w-5 text-[hsl(0,100%,20%)]" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
