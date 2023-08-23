"use client"

import { FC, useState, HTMLAttributes, useContext, useRef } from "react"
import { cn } from "@/lib/utils"
import { MessagesContext } from "@/context/messages"
import TextareaAutosize from 'react-textarea-autosize'
import { useMutation } from "@tanstack/react-query"
import { nanoid } from "nanoid"
import { Message } from '@/lib/validators/message'
import { CornerDownLeft, Loader2 } from "lucide-react"
import { toast } from 'react-hot-toast'
import { text } from "stream/consumers"

interface ChatInputProps extends HTMLAttributes<HTMLDivElement> { }

export const ChatInput: FC<ChatInputProps> = ({ className, ...props }) => {
  const [input, setInput] = useState<string>('')
  const {
    messages,
    addMessage,
    removeMessage,
    updateMessage,
    setIsMessageUpdating,
  } = useContext(MessagesContext);

  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { mutate: sendMessage, isLoading } = useMutation({
    mutationFn: async (message: Message) => {
      const response = await fetch('/api/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: [message] }),
      })

      if (!response.ok)
        throw new Error('Error sending message.. Please try again.')

      return response.body
    },
    onMutate(message) {
      addMessage(message);
    },
    onSuccess: async (stream) => {
      if (!stream)
        throw new Error('No stream returned from server')

      const id = nanoid()

      const resMessage: Message = {
        id,
        isUserMessage: false,
        text: '',
      }

      addMessage(resMessage);
      setIsMessageUpdating(true);

      const reader = stream.getReader()
      const decoder = new TextDecoder()
      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading;
        const chunkValue = decoder.decode(value);
        updateMessage(id, (prev) => prev + chunkValue);
      }
      setIsMessageUpdating(false);
      setInput('');
      inputRef.current?.focus();
    },
    onError: (_, message) => {
      toast.error('Error sending message.. Please try again.');
      removeMessage(message.id);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    },
  })

  return (
    <div className={cn('border-t border-zinc-300', className)} {...props}>
      <div className="relative my-2 flex-1 overflow-hidden rounded-lg border-none outline-none">
        <TextareaAutosize
          ref={inputRef}
          rows={2}
          maxRows={4}
          autoFocus
          placeholder="Type a message..."
          disabled={isLoading}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()

              const message: Message = {
                id: nanoid(),
                isUserMessage: true,
                text: input,
              }

              sendMessage(message)
            }
          }}
          className="block w-full peer pr-14 py-1.5 resize-none border-0 bg-zinc-100 disabled:opacity-50 focus:ring-0 text-gray-900 text-sm sm:leading-6"
        />
        <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
          <kbd className="inline-flex items-center rounded border bg-white border-gray-200 px-1 font-sans text-xs text-gray-400">
            {isLoading ?
              <Loader2 className='w-3 h-3 animate-spin' /> :
              <CornerDownLeft className='w-3 h-3' />
            }
          </kbd>
        </div>
        <div aria-hidden='true' className="absolute inset-x-0 bottom-0 border-t border-gray-300 peer-focus:border-t-2 peer-focus:border-indigo-600" />
      </div>
    </div>
  )
}