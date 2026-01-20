import { Loader } from 'lucide-react';
import React, { useState } from 'react'
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';
import api from '@/configs/axios';
import { useNavigate } from 'react-router';

const Home = () => {

  const { data: session } = authClient.useSession();
  const navigate = useNavigate();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if(!session?.user){
        return toast.error('Please sign in to create a project')
      }else if(!input.trim()){
        return toast.error('Please enter a message')
      }
      setLoading(true);
      const { data } = await api.post('/api/user/project', {initial_prompt: input})
      setLoading(false);
      navigate(`/projects/${data.projectId}`)
    } catch (error : any) {
        setLoading(false);
        toast.error(error?.response?.data?.message || 'Failed to create project');
        console.log("There is the error", error)
    }
  }

  return (

    <section className=" flex flex-col items-center text-white Ftext-sm pb-20 px-4 font-poppins relative  overflow-hidden">
      {/* BACKGROUND IMAGE */}


      <a href="/" className="flex items-center gap-2 border border-slate-700 rounded-full p-1 pr-3 text-sm mt-20">
        <span className="bg-indigo-600 text-xs px-3 py-1 rounded-full">NEW</span>
        <p className="flex items-center gap-2">
          <svg className="mt-px" width="6" height="9" viewBox="0 0 6 9" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="m1 1 4 3.5L1 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Try 30  days free trial option
        </p>
      </a>

      <h1 className="text-center text-[40px] leading-12 md:text-6xl md:leading-[70px] mt-4 font-semibold max-w-3xl">
        Turn thoughts into websites instantly, with AI.
      </h1>

      <p className="text-center text-base max-w-md mt-2">
        Create, customize and publish website faster than ever with our AI Site Builder.
      </p>

      <form onSubmit={onSubmitHandler} className="bg-white/10 max-w-2xl w-full rounded-xl p-4 mt-10 border border-indigo-600/70 focus-within:ring-2 ring-indigo-500 transition-all">
        <textarea value={input} onChange={(e) => setInput(e.target.value)} className="bg-transparent outline-none text-gray-300 resize-none w-full" rows={4} placeholder="Describe your presentation in details" required />
        <button className="ml-auto flex items-center gap-2 bg-gradient-to-r from-[#232bce] to-[#6007f9] rounded-md px-4 py-2">
          {!loading ? 'Create With AI' : (
            <>
              Creating <Loader className='animate-spin' />

            </>
          )}
        </button>
      </form>

      {/* <div className="flex flex-wrap items-center justify-center gap-16 md:gap-20 mx-auto mt-16">
        <img className="max-w-28 md:max-w-32 bg-red-500" src="https://saasly.prebuiltui.com/assets/companies-logo/framer.svg" alt="" />
        <img className="max-w-28 md:max-w-32 bg-red-500" src="https://saasly.prebuiltui.com/assets/companies-logo/huawei.svg" alt="" />
        <img className="max-w-28 md:max-w-32 bg-red-500" src="https://saasly.prebuiltui.com/assets/companies-logo/instagram.svg" alt="" />
        <img className="max-w-28 md:max-w-32 bg-red-500" src="https://saasly.prebuiltui.com/assets/companies-logo/microsoft.svg" alt="" />
      </div> */}
    </section>
  )
}

export default Home
