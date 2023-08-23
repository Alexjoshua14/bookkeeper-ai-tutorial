'use client'

import { FC } from "react"
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { MessagesProvider } from '@/context/messages'

interface ProviderProps {
  children: React.ReactNode
}

export const Providers: FC<ProviderProps> = ({ children }) => {
  const queryClient = new QueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <MessagesProvider>
        {children}
      </MessagesProvider>
    </QueryClientProvider>
  )
}