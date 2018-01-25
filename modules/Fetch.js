/* @flow */

import React from 'react'
import PropTypes from 'prop-types'

import requestToApi from './requestToApi'
import type { DefaultProps, Props, ReturnedData } from './types'

class Fetch extends React.Component<Props, void> {
  props: Props
  _isUnmounted: boolean = false
  _isLoaded: boolean = false

  static propTypes = {
    children: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
    loader: PropTypes.element,
    onFetch: PropTypes.func,
    params: PropTypes.shape({
      method: PropTypes.oneOf([
        'DELETE',
        'FORM_DATA',
        'GET',
        'HEAD',
        'PATCH',
        'POST',
        'PUT',
        'TRACE',
      ]),
      body: PropTypes.object,
    }),
    path: PropTypes.string.isRequired,
    refetch: PropTypes.bool,
    render: PropTypes.func,
    resultOnly: PropTypes.bool,
  }

  static defaultProps: DefaultProps = {
    children: undefined,
    loader: undefined,
    onFetch: undefined,
    params: {
      method: 'GET',
      body: {},
    },
    refetch: false,
    render: undefined,
    resultOnly: false,
  }

  componentWillReceiveProps(nextProps: Props) {
    if (
      nextProps.path !== this.props.path ||
      nextProps.refetch !== this.props.refetch
    ) {
      this._handleData({
        data: undefined,
        error: undefined,
        isOK: undefined,
        loaded: false,
        status: false,
      })
      this._fetchData(nextProps)
    }
  }

  componentWillUnmount() {
    this._isUnmounted = true
  }

  shouldComponentUpdate = (nextProps: Props): boolean => {
    if (this.props.children !== nextProps.children) return true
    if (this.props.onFetch !== nextProps.onFetch) return true
    if (this.props.params !== nextProps.params) return true
    if (this.props.path !== nextProps.path) return true
    if (this.props.refetch !== nextProps.refetch) return true
    if (this.props.render !== nextProps.render) return true
    if (this._isLoaded) return true
    return false
  }

  _fetchData = async (props: Props): Promise<any> => {
    const { headers, path, params } = props
    const body = params && params.body ? params.body : {}
    const method = params && params.method ? params.method : 'GET'

    try {
      const apiResponse = await requestToApi(path, method, body, headers)
      if (!this.unmounted && !apiResponse.error) {
        this._handleData({
          data: apiResponse.result,
          error: undefined,
          isOK: apiResponse.isOK,
          loaded: true,
          response: apiResponse.response,
          status: apiResponse.status,
        })
      } else if (!this.unmounted && apiResponse.error) {
        this._handleData({
          data: undefined,
          error: apiResponse,
          isOK: false,
          loaded: true,
          status: false,
        })
      }
    } catch (error) {
      if (!this.unmounted) {
        console.log(
          `%c Route "${path}" resolved with:`,
          'color: #F2345A',
          error,
        )
        this._handleData({
          data: undefined,
          error: 'Something went wrong during the request 😯…',
          isOK: false,
          loaded: true,
          status: false,
        })
      }
    }
  }

  _returnData = (result: ReturnedData): void => {
    if (this.props.onFetch) {
      if (this.props.resultOnly) {
        this.props.onFetch(result.data)
      } else this.props.onFetch(result)
    }
    if (this.props.render) {
      if (this.props.resultOnly) {
        this.props.render(result.data)
      } else this.props.render(result)
    }
    if (this.props.children) {
      if (this.props.resultOnly) {
        this.props.children(result.data)
      } else this.props.children(result)
    }
  }

  _handleData = (result: ReturnedData): void => {
    if (!this._isUnmounted) {
      this._isLoaded = true
      this._returnData(result)
    }
  }

  render() {
    if (!this._isLoaded) {
      return this.props.loader ? this.props.loader() : null
    }
    return null
  }
}

export default Fetch
