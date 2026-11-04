import { Toaster as Sonner } from 'sonner'

function Toaster(props) {
  return (
    <Sonner
      position="top-right"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: '!rounded-[10px] !border-0 !bg-[#101828] !text-white !shadow-lg',
          description: '!text-[#D0D5DD]',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
