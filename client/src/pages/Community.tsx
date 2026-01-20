import { useEffect, useState } from 'react'
import type { Project } from '../types';
import { Loader } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { dummyProjects } from '../assets/assets';
import api from '@/configs/axios';
import { toast } from 'sonner';

const Community = () => {
  const [loading, setLaoding] = useState(true);
  const [projects, setProjects] = useState<Project[]>([])
  const navigate = useNavigate()



  const fetchProjects = async () => {
    try {
      const {data} = await api.get('/api/project/published');
      setProjects(data.projects);
      setLaoding(false);
    } catch (error: any) {
        toast.error(error?.response?.data?.message || error.message);
        console.log(error)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  return (
    <>
      <div className='px-4 md:px-16 lg:px-32'>
        {loading ? (
          <div className='flex items-center justify-center h-[80vh]'>
            <Loader className='size-7 animate-spin text-indigo-200' />
          </div>
        ) : projects.length > 0 ? (
          <div className='py-10 min-h-[80vh]'>
            <div className='flex items-center justify-between mb-12'>
              <h1 className='text-2xl font-medium text-white'>Published Projects</h1>
            </div>

            <div className='flex flex-wrap gap-3.5'>
              {projects.map((project) => (
                <Link  key={project.id}
                to={`/view/${project.id}`}
                target='_blank'
                 className='w-72 max-sm:mx-auto cursor-pointer bg-gray-900/60 border border-gray-700 rounded-lg overflow-hidden group hover:border-indigo-800/80 transition-all duration-300'>
                  {/* Desktop-like mini Priview */}
                  <div className='relative w-full h-40 bg-gray-900 overflow-hidden border-b border-gray-800'>
                    {project.current_code ? (
                      <iframe
                        srcDoc={project.current_code}
                        className='absolute top-0 left-0 w-[1200px] h-[800px] origin-top-left pointer-events-none' 
                        sandbox='allow-scripts all-same-origin'
                        style={{ transform: 'scale(0.25)' }}
                      />
                    ) : (
                      <div className='flex items-center justify-center h-full text-gray-500'>No Priview</div>
                    )}
                  </div>
                  {/* Content */}
                  <div className='p-4 text-ehite bg-linear-180 from-transparent group-hover:from-indigo-950 to-transparent transition-colors'>
                      <div className='flex items-start justify-between'>
                          <h2 className='text-lg font-medium line-clamp-2 text-white'>{project.name}</h2>
                          <button className='px-2.5 py-0.5 mt-1 ml-2 text-xs bg-gray-800 border text-white border-gray-700 rounded-full'>Website</button>
                      </div>
                      <p className='text-gray-400 mt-1 text-sm line-clamp-2'>{project.initial_prompt}</p>

                      <div  className='flex justify-between items-center mt-6'>
                          <span className='text-xs text-gray-500'>{new Date(project.createdAt).toLocaleDateString()}</span>
                          <div className='flex gap-3 text-white text-sm'>
                              <button className='px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-md transition-colors flex items-center gap-2'>
                                <span>{project.user?.name?.slice(0,1)}</span>
                                <span>{project.user?.name}</span>
                              </button>
                          </div>
                      </div>
                  </div>
                </Link>
              ))}
            </div>

          </div>
        ) : (
          <div className='flex flex-col items-center justify-center h-[80vh]'>
            <h1 className='text-3xl font-semibold text-gray-300'>You have no projects yet!</h1>
            <button onClick={() => navigate('/')} className='text-white px-5 py-2 mt-5 rounded-md bg-indigo-500 hover:bg-indigo-600 active:scale-95 transition-all'>Create New</button>
          </div>
        )}
      </div>
    </>
  )
}

export default Community
